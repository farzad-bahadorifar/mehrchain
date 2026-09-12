import { Injectable, inject } from '@angular/core';
import { Commitment } from '@mehrchain/shared-data';
import { CommitmentStore } from '../store/commitment.store';

/**
 * Facade service for CommitmentStore.
 * Provides backwards-compatibility for existing components while delegating state
 * and mutations directly to NgRx SignalStore.
 */
@Injectable({
  providedIn: 'root',
})
export class CommitmentService {
  private readonly store = inject(CommitmentStore);

  // Selectors
  readonly commitments = this.store.commitments;
  readonly hasAnyCommitment = this.store.hasAnyCommitment;
  readonly overallStreak = this.store.overallStreak;
  readonly archivedCommitments = this.store.archivedCommitments;
  readonly isLoading = this.store.isLoading;

  // Actions
  loadForUser(userId: string): void {
    this.store.loadForUser(userId);
  }

  syncWithBackend(): Promise<void> {
    return this.store.syncWithBackend();
  }

  addCommitment(data: Partial<Commitment>): Promise<Commitment> {
    return this.store.addCommitment(data);
  }

  completeCommitment(id: string, note?: string): Promise<void> {
    return this.store.completeCommitment(id, note);
  }

  updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment> {
    return this.store.updateCommitment(id, updates);
  }

  removeCommitment(id: string): Promise<void> {
    return this.store.removeCommitment(id);
  }

  fetchArchivedCommitments(): Promise<Commitment[]> {
    return this.store.fetchArchivedCommitments();
  }

  restoreCommitment(id: string): Promise<void> {
    return this.store.restoreCommitment(id);
  }

  resetData(): void {
    this.store.resetState();
  }

  clearUserStorage(userId: string): void {
    this.store.clearUserStorage(userId);
  }
}
