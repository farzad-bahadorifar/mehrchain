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

export interface CommitmentState {
  commitments: Commitment[];
  archivedCommitments: Commitment[];
  isLoading: boolean;
  activeUserId: string | null;
}

const initialState: CommitmentState = {
  commitments: [],
  archivedCommitments: [],
  isLoading: false,
  activeUserId: null,
};

export function getUserStorageKey(userId: string): string {
  return `mehrchain_commitments_${userId}`;
}

function loadCommitmentsFromStorage(userId: string): Commitment[] {
  try {
    const raw = localStorage.getItem(getUserStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[CommitmentStore] Failed to load local cache for user', userId, e);
  }
  return [];
}

export const CommitmentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasAnyCommitment: computed(() => store.commitments().length > 0),
    overallStreak: computed(() => {
      const list = store.commitments();
      return list.length > 0 ? Math.max(...list.map((c) => c.currentStreak || 0)) : 0;
    }),
  })),
  withMethods((store) => {
    const http = inject(HttpClient);
    const API_URL = `${environment.apiUrl}/commitments`;

    return {
      /**
       * Initializes store for a specific authenticated user from isolated local cache.
       */
      loadForUser(userId: string): void {
        const cached = loadCommitmentsFromStorage(userId);
        patchState(store, {
          activeUserId: userId,
          commitments: cached,
        });
      },

      /**
       * Fetches latest user commitments from backend API if authenticated.
       */
      async syncWithBackend(): Promise<void> {
        const token = localStorage.getItem('mehrchain_auth_token_v1');
        if (!token) return;

        try {
          patchState(store, { isLoading: true });
          const remoteData = await firstValueFrom(http.get<Commitment[]>(API_URL));

          if (Array.isArray(remoteData)) {
            patchState(store, { commitments: remoteData, isLoading: false });
          } else {
            patchState(store, { isLoading: false });
          }
        } catch (err) {
          console.warn('[CommitmentStore] Background sync failed, using cached data.', err);
          patchState(store, { isLoading: false });
        }
      },

      /**
       * Creates a new commitment via backend API and caches locally.
       */
      async addCommitment(data: Partial<Commitment>): Promise<Commitment> {
        const localCommitment: Commitment = {
          id: crypto.randomUUID(),
          title: data.title!,
          totalDays: data.totalDays || 21,
          currentDay: 0,
          currentStreak: 0,
          isCompletedToday: false,
          category: data.category as any,
          why: data.why,
          rippleEffects: data.rippleEffects,
          startDate: new Date().toISOString(),
          reminderTime: data.reminderTime,
          isPublic: data.isPublic !== undefined ? data.isPublic : false,
          history: [],
        };

        // Optimistic state update
        patchState(store, {
          commitments: [localCommitment, ...store.commitments()],
        });

        // Send to backend if authenticated
        try {
          const token = localStorage.getItem('mehrchain_auth_token_v1');
          if (token) {
            const payload = {
              title: localCommitment.title,
              category: localCommitment.category,
              why: localCommitment.why,
              totalDays: localCommitment.totalDays,
              reminderTime: localCommitment.reminderTime,
            };

            const serverRecord = await firstValueFrom(
              http.post<Commitment>(API_URL, payload)
            );

            if (serverRecord && serverRecord.id) {
              patchState(store, {
                commitments: store
                  .commitments()
                  .map((c) => (c.id === localCommitment.id ? serverRecord : c)),
              });
              return serverRecord;
            }
          }
        } catch (err) {
          console.warn('[CommitmentStore] Failed to persist to backend, retained locally.', err);
        }

        return localCommitment;
      },

      /**
       * Marks a commitment completed today via backend API.
       */
      async completeCommitment(id: string, note?: string): Promise<void> {
        const today = new Date().toISOString();

        // Optimistic local update
        patchState(store, {
          commitments: store.commitments().map((c) => {
            if (c.id === id && !c.isCompletedToday) {
              return {
                ...c,
                currentStreak: (c.currentStreak || 0) + 1,
                currentDay: Math.min((c.currentDay || 0) + 1, c.totalDays),
                isCompletedToday: true,
                history: [...(c.history || []), today],
              };
            }
            return c;
          }),
        });

        // Sync with backend API
        try {
          const token = localStorage.getItem('mehrchain_auth_token_v1');
          if (token) {
            const updated = await firstValueFrom(
              http.patch<Commitment>(`${API_URL}/${id}/complete`, { note })
            );

            if (updated) {
              patchState(store, {
                commitments: store
                  .commitments()
                  .map((c) => (c.id === id ? { ...c, ...updated, isCompletedToday: true } : c)),
              });
            }
          }
        } catch (err) {
          console.warn('[CommitmentStore] Failed to complete on backend.', err);
        }
      },

      /**
       * Updates an existing commitment.
       */
      async updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment> {
        let updatedItem: Commitment | undefined;

        patchState(store, {
          commitments: store.commitments().map((c) => {
            if (c.id === id) {
              updatedItem = { ...c, ...updates };
              return updatedItem;
            }
            return c;
          }),
        });

        try {
          const token = localStorage.getItem('mehrchain_auth_token_v1');
          if (token) {
            const backendUpdated = await firstValueFrom(
              http.patch<Commitment>(`${API_URL}/${id}`, updates)
            );
            if (backendUpdated) {
              patchState(store, {
                commitments: store
                  .commitments()
                  .map((c) => (c.id === id ? { ...c, ...backendUpdated } : c)),
              });
              return backendUpdated;
            }
          }
        } catch (err) {
          console.warn('[CommitmentStore] Failed to update commitment on backend.', err);
        }

        return updatedItem!;
      },

      /**
       * Archives or removes a commitment.
       */
      async removeCommitment(id: string): Promise<void> {
        const target = store.commitments().find((c) => c.id === id);
        patchState(store, {
          commitments: store.commitments().filter((c) => c.id !== id),
          archivedCommitments: target
            ? [{ ...target, isArchived: true }, ...store.archivedCommitments()]
            : store.archivedCommitments(),
        });

        try {
          const token = localStorage.getItem('mehrchain_auth_token_v1');
          if (token) {
            await firstValueFrom(http.delete(`${API_URL}/${id}`));
          }
        } catch (err) {
          console.warn('[CommitmentStore] Failed to archive on backend.', err);
        }
      },

      /**
       * Fetches archived commitments from backend API.
       */
      async fetchArchivedCommitments(): Promise<Commitment[]> {
        try {
          const token = localStorage.getItem('mehrchain_auth_token_v1');
          if (token) {
            const list = await firstValueFrom(http.get<Commitment[]>(`${API_URL}/archived`));
            if (Array.isArray(list)) {
              patchState(store, { archivedCommitments: list });
              return list;
            }
          }
        } catch (err) {
          console.warn('[CommitmentStore] Failed to fetch archived commitments:', err);
        }
        return store.archivedCommitments();
      },

      /**
       * Restores an archived commitment.
       */
      async restoreCommitment(id: string): Promise<void> {
        const target = store.archivedCommitments().find((c) => c.id === id);

        patchState(store, {
          archivedCommitments: store.archivedCommitments().filter((c) => c.id !== id),
          commitments: target
            ? [{ ...target, isArchived: false }, ...store.commitments()]
            : store.commitments(),
        });

        try {
          const token = localStorage.getItem('mehrchain_auth_token_v1');
          if (token) {
            await firstValueFrom(http.patch(`${API_URL}/${id}/restore`, {}));
          }
        } catch (err) {
          console.warn('[CommitmentStore] Failed to restore commitment on backend:', err);
        }
      },

      /**
       * Permanently deletes a commitment from both local state and backend database.
       */
      async permanentDeleteCommitment(id: string): Promise<void> {
        patchState(store, {
          commitments: store.commitments().filter((c) => c.id !== id),
          archivedCommitments: store.archivedCommitments().filter((c) => c.id !== id),
        });

        try {
          const token = localStorage.getItem('mehrchain_auth_token_v1');
          if (token) {
            await firstValueFrom(http.delete(`${API_URL}/${id}/permanent`));
          }
        } catch (err) {
          console.warn('[CommitmentStore] Failed to permanently delete commitment on backend:', err);
        }
      },

      /**
       * Purges all in-memory commitments and resets active session state.
       * Does NOT erase user's offline cache key.
       */
      resetState(): void {
        patchState(store, {
          commitments: [],
          archivedCommitments: [],
          activeUserId: null,
          isLoading: false,
        });
      },

      /**
       * Completely erases the local cache key for a specific user.
       */
      clearUserStorage(userId: string): void {
        try {
          localStorage.removeItem(getUserStorageKey(userId));
        } catch (e) {
          console.error('[CommitmentStore] Failed to clear user storage', e);
        }
      },
    };
  }),
  withHooks({
    onInit(store) {
      // Automatically keep local cache updated for the active user only
      effect(() => {
        const userId = store.activeUserId();
        const commitments = store.commitments();
        if (userId) {
          try {
            localStorage.setItem(getUserStorageKey(userId), JSON.stringify(commitments));
          } catch (e) {
            console.error('[CommitmentStore] Failed to save local cache', e);
          }
        }
      });
    },
  })
);

export type CommitmentStore = InstanceType<typeof CommitmentStore>;
