import { HttpClient } from '@angular/common/http';
import { computed, effect, inject } from '@angular/core';
import { Commitment } from '@mehrchain/shared-data';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColdStartService } from '../services/cold-start.service';

export interface CommitmentState {
  commitments: Commitment[];
  archivedCommitments: Commitment[];
  isLoading: boolean;
  syncError: string | null;
  activeUserId: string | null;
}
const initialState: CommitmentState = {
  commitments: [],
  archivedCommitments: [],
  isLoading: false,
  syncError: null,
  activeUserId: null,
};
export function getUserStorageKey(userId: string): string {
  return `mehrchain_commitments_${userId}`;
}
export function getUserArchivedStorageKey(userId: string): string {
  return `mehrchain_archived_commitments_${userId}`;
}
export function isRemoteToken(token: string | null): boolean {
  return !!token && !token.startsWith('local_') && !token.startsWith('mock_');
}
function readCache(key: string): Commitment[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
export const CommitmentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasAnyCommitment: computed(() => store.commitments().length > 0),
    overallStreak: computed(() =>
      Math.max(0, ...store.commitments().map((c) => c.currentStreak || 0)),
    ),
  })),
  withMethods((store) => {
    const http = inject(HttpClient);
    const coldStart = inject(ColdStartService);
    const API = `${environment.apiUrl}/commitments`;
    const remote = () => {
      const token = localStorage.getItem('mehrchain_auth_token_v1');
      if (environment.production && !isRemoteToken(token))
        throw new Error('Please sign in to save your habit.');
      return isRemoteToken(token);
    };
    // Apply writes only after server confirmation, and reject replies from an earlier session.
    async function confirmed<T>(request: () => Promise<T>): Promise<T> {
      const user = store.activeUserId();
      const token = localStorage.getItem('mehrchain_auth_token_v1');
      coldStart.startRequest();
      try {
        const result = await request();
        if (
          store.activeUserId() !== user ||
          localStorage.getItem('mehrchain_auth_token_v1') !== token
        )
          throw new Error('Your session changed. Please reload.');
        return result;
      } finally {
        coldStart.finishRequest();
      }
    }
    function record(value: Commitment): Commitment {
      if (!value?.id)
        throw new Error(
          'The server did not confirm the saved habit. Please reload before retrying.',
        );
      return value;
    }
    let mutationVersion = 0;
    const completionRequests = new Map<string, Promise<void>>();
    return {
      loadForUser(userId: string): void {
        patchState(store, {
          activeUserId: userId,
          syncError: null,
          commitments: readCache(getUserStorageKey(userId)),
          archivedCommitments: readCache(getUserArchivedStorageKey(userId)),
        });
      },
      async syncWithBackend(): Promise<void> {
        if (!remote()) return;
        patchState(store, { isLoading: true, syncError: null });
        const user = store.activeUserId();
        const version = mutationVersion;
        try {
          const data = await confirmed(() => firstValueFrom(http.get<Commitment[]>(API)));
          if (!Array.isArray(data)) throw new Error('Unable to load habits.');
          if (version === mutationVersion) patchState(store, { commitments: data });
        } catch {
          if (store.activeUserId() === user)
            patchState(store, { syncError: 'Could not refresh habits. Showing saved cache.' });
        } finally {
          if (store.activeUserId() === user) patchState(store, { isLoading: false });
        }
      },
      async addCommitment(data: Partial<Commitment>): Promise<Commitment> {
        const payload = {
          title: data.title,
          category: data.category,
          why: data.why,
          totalDays: data.totalDays ?? 21,
          reminderTime: data.reminderTime,
          isPublic: data.isPublic ?? false,
        };
        const saved = remote()
          ? record(await confirmed(() => firstValueFrom(http.post<Commitment>(API, payload))))
          : ({
              ...payload,
              id: crypto.randomUUID(),
              currentDay: 0,
              currentStreak: 0,
              isCompletedToday: false,
              startDate: new Date().toISOString(),
              history: [],
            } as Commitment);
        mutationVersion++;
        patchState(store, { commitments: [saved, ...store.commitments()] });
        return saved;
      },
      completeCommitment(id: string, note?: string): Promise<void> {
        const existing = completionRequests.get(id);
        if (existing) return existing;
        const request = (async () => {
          const target = store.commitments().find((c) => c.id === id);
          if (!target) throw new Error('Habit not found. Please reload.');
          const updated = remote()
            ? record(
                await confirmed(() =>
                  firstValueFrom(http.patch<Commitment>(`${API}/${id}/complete`, { note })),
                ),
              )
            : target.isCompletedToday
              ? target
              : {
                  ...target,
                  currentStreak: target.currentStreak + 1,
                  currentDay:
                    target.totalDays === -1
                      ? target.currentDay + 1
                      : Math.min(target.currentDay + 1, target.totalDays),
                  isCompletedToday: true,
                  history: [...(target.history || []), new Date().toISOString()],
                };
          mutationVersion++;
          patchState(store, {
            commitments: store
              .commitments()
              .map((c) => (c.id === id ? { ...updated, isCompletedToday: true } : c)),
          });
        })().finally(() => completionRequests.delete(id));
        completionRequests.set(id, request);
        return request;
      },
      async updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment> {
        const target = store.commitments().find((c) => c.id === id);
        if (!target) throw new Error('Habit not found.');
        const { title, category, why, totalDays, reminderTime, isPublic } = updates;
        const updated = remote()
          ? record(
              await confirmed(() =>
                firstValueFrom(
                  http.patch<Commitment>(`${API}/${id}`, {
                    title,
                    category,
                    why,
                    totalDays,
                    reminderTime,
                    isPublic,
                  }),
                ),
              ),
            )
          : { ...target, ...updates };
        mutationVersion++;
        patchState(store, {
          commitments: store.commitments().map((c) => (c.id === id ? updated : c)),
        });
        return updated;
      },
      async removeCommitment(id: string): Promise<void> {
        const target = store.commitments().find((c) => c.id === id);
        if (remote()) await confirmed(() => firstValueFrom(http.delete(`${API}/${id}`)));
        mutationVersion++;
        patchState(store, {
          commitments: store.commitments().filter((c) => c.id !== id),
          archivedCommitments: target
            ? [
                { ...target, isArchived: true },
                ...store.archivedCommitments().filter((c) => c.id !== id),
              ]
            : store.archivedCommitments(),
        });
      },
      async fetchArchivedCommitments(): Promise<Commitment[]> {
        if (!remote()) return store.archivedCommitments();
        const version = mutationVersion;
        const data = await confirmed(() =>
          firstValueFrom(http.get<Commitment[]>(`${API}/archived`)),
        );
        if (!Array.isArray(data)) throw new Error('Unable to load archived habits.');
        if (version === mutationVersion) patchState(store, { archivedCommitments: data });
        return data;
      },
      async restoreCommitment(id: string): Promise<void> {
        const target = store.archivedCommitments().find((c) => c.id === id);
        const saved = remote()
          ? record(
              await confirmed(() =>
                firstValueFrom(http.patch<Commitment>(`${API}/${id}/restore`, {})),
              ),
            )
          : target;
        mutationVersion++;
        patchState(store, {
          archivedCommitments: store.archivedCommitments().filter((c) => c.id !== id),
          commitments: saved
            ? [{ ...saved, isArchived: false }, ...store.commitments().filter((c) => c.id !== id)]
            : store.commitments(),
        });
      },
      async permanentDeleteCommitment(id: string): Promise<void> {
        if (remote()) await confirmed(() => firstValueFrom(http.delete(`${API}/${id}/permanent`)));
        mutationVersion++;
        patchState(store, {
          commitments: store.commitments().filter((c) => c.id !== id),
          archivedCommitments: store.archivedCommitments().filter((c) => c.id !== id),
        });
      },
      resetState(): void {
        patchState(store, initialState);
      },
      clearUserStorage(userId: string): void {
        localStorage.removeItem(getUserStorageKey(userId));
        localStorage.removeItem(getUserArchivedStorageKey(userId));
      },
    };
  }),
  withHooks({
    onInit(store) {
      effect(() => {
        const id = store.activeUserId();
        const data = store.commitments();
        if (id) {
          try {
            localStorage.setItem(getUserStorageKey(id), JSON.stringify(data));
          } catch {
            /* Cache is optional; the server retains saved data. */
          }
        }
      });
      effect(() => {
        const id = store.activeUserId();
        const data = store.archivedCommitments();
        if (id) {
          try {
            localStorage.setItem(getUserArchivedStorageKey(id), JSON.stringify(data));
          } catch {
            /* Cache is optional. */
          }
        }
      });
    },
  }),
);
export type CommitmentStore = InstanceType<typeof CommitmentStore>;
