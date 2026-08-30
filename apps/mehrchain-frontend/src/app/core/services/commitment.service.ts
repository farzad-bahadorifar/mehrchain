import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Commitment } from '@mehrchain/shared-data';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommitmentService {
  private http = inject(HttpClient);

  private readonly STORAGE_KEY = 'mehrchain_data_v1';
  private readonly API_URL = `${environment.apiUrl}/commitments`;

  // State
  private commitmentsSignal = signal<Commitment[]>([]);

  constructor() {
    this.loadFromStorage();
    this.syncWithBackend();

    // Keep local cache updated for offline resilience
    effect(() => {
      const data = this.commitmentsSignal();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    });
  }

  // Selectors
  readonly commitments = this.commitmentsSignal.asReadonly();
  readonly hasAnyCommitment = computed(() => this.commitmentsSignal().length > 0);

  readonly overallStreak = computed(() => {
    const list = this.commitmentsSignal();
    return list.length > 0 ? Math.max(...list.map((c) => c.currentStreak)) : 0;
  });

  // Actions
  private loadFromStorage() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.commitmentsSignal.set(parsed);
      } catch (e) {
        console.error('[CommitmentService] Local data load failed', e);
      }
    }
  }

  /**
   * Fetches latest user commitments from backend API if authenticated.
   */
  async syncWithBackend(): Promise<void> {
    try {
      const token = localStorage.getItem('mehrchain_auth_token_v1');
      if (!token) return;

      const remoteData = await firstValueFrom(
        this.http.get<Commitment[]>(this.API_URL)
      );

      if (Array.isArray(remoteData)) {
        this.commitmentsSignal.set(remoteData);
      }
    } catch (err) {
      console.warn('[CommitmentService] Background sync failed, using cached data.', err);
    }
  }

  /**
   * Creates a new commitment via backend API and caches locally.
   */
  async addCommitment(data: Partial<Commitment>): Promise<Commitment> {
    // Generate optimistic local model
    const localCommitment: Commitment = {
      id: crypto.randomUUID(),
      title: data.title!,
      totalDays: data.totalDays || 21,
      currentDay: 1,
      currentStreak: 0,
      isCompletedToday: false,
      category: data.category as any,
      why: data.why,
      rippleEffects: data.rippleEffects,
      startDate: new Date().toISOString(),
      reminderTime: data.reminderTime,
      history: [],
    };

    // Optimistic state update
    this.commitmentsSignal.update((list) => [localCommitment, ...list]);

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
          this.http.post<Commitment>(this.API_URL, payload)
        );

        if (serverRecord && serverRecord.id) {
          this.commitmentsSignal.update((list) =>
            list.map((c) => (c.id === localCommitment.id ? serverRecord : c))
          );
          return serverRecord;
        }
      }
    } catch (err) {
      console.warn('[CommitmentService] Failed to persist to backend, retained locally.', err);
    }

    return localCommitment;
  }

  /**
   * Marks a commitment completed today via backend API.
   */
  async completeCommitment(id: string, note?: string): Promise<void> {
    const today = new Date().toISOString();

    // Optimistic local update
    this.commitmentsSignal.update((list) =>
      list.map((c) => {
        if (c.id === id && !c.isCompletedToday) {
          return {
            ...c,
            currentStreak: c.currentStreak + 1,
            currentDay: Math.min(c.currentDay + 1, c.totalDays),
            isCompletedToday: true,
            history: [...(c.history || []), today],
          };
        }
        return c;
      })
    );

    // Sync with backend API
    try {
      const token = localStorage.getItem('mehrchain_auth_token_v1');
      if (token) {
        const updated = await firstValueFrom(
          this.http.patch<Commitment>(`${this.API_URL}/${id}/complete`, { note })
        );

        if (updated) {
          this.commitmentsSignal.update((list) =>
            list.map((c) => (c.id === id ? { ...c, ...updated, isCompletedToday: true } : c))
          );
        }
      }
    } catch (err) {
      console.warn('[CommitmentService] Failed to complete on backend.', err);
    }
  }

  /**
   * Archives or removes a commitment.
   */
  async removeCommitment(id: string): Promise<void> {
    this.commitmentsSignal.update((list) => list.filter((c) => c.id !== id));

    try {
      const token = localStorage.getItem('mehrchain_auth_token_v1');
      if (token) {
        await firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
      }
    } catch (err) {
      console.warn('[CommitmentService] Failed to archive on backend.', err);
    }
  }

  resetData() {
    this.commitmentsSignal.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
