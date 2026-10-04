import { Injectable, computed, inject } from '@angular/core';
import { CommitmentService } from './commitment.service';
import { ChainService } from './chain.service';

export type MeroMood = 'sad' | 'happy' | 'kind';

@Injectable({
  providedIn: 'root',
})
export class MeroMoodService {
  private commitmentService = inject(CommitmentService);
  private chainService = inject(ChainService);

  /** Whether the user has completed at least one habit today */
  readonly hasSparkedToday = computed(() =>
    this.commitmentService.commitments().some((c) => c.isCompletedToday)
  );

  /** Whether the user has sent heart support to any chain partner */
  readonly hasSupported = computed(() =>
    this.chainService.connections().some((c) => c.heartSent === true)
  );

  /** Computed mood for Mero in Profile */
  readonly mood = computed<MeroMood>(() => {
    const sparked = this.hasSparkedToday();
    const supported = this.hasSupported();

    if (!sparked) return 'sad';
    if (sparked && supported) return 'kind';
    return 'happy';
  });
}
