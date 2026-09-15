import { Injectable, computed, inject, signal } from '@angular/core';
import { CommitmentService } from './commitment.service';

export interface DuoChain {
  id: string;
  partnerName: string;
  partnerAvatar?: string;
  myCommitmentId: string;
  myCommitmentTitle: string;
  partnerCommitmentTitle: string;
  streak: number;
  partnerCompletedToday: boolean;
  myCompletedToday: boolean;
  lastReaction?: {
    type: 'heart' | 'nudge';
    from: string;
    message?: string;
    timestamp: Date;
  };
  createdAt: Date;
}

const STORAGE_KEY = 'mehrchain_duo_chains';

@Injectable({
  providedIn: 'root',
})
export class ChainService {
  private commitmentService = inject(CommitmentService);

  // Stored connected friend chains
  private _friendChains = signal<DuoChain[]>(this.loadStoredChains());

  readonly friendChains = computed(() => this._friendChains());

  // Only public commitments are eligible to be chained
  readonly publicCommitments = computed(() =>
    this.commitmentService.commitments().filter((c) => c.isPublic === true)
  );

  // Active commitment selection for invite
  readonly selectedCommitmentId = signal<string>('');

  constructor() {
    // Select first public commitment if available
    const pubList = this.publicCommitments();
    if (pubList.length > 0) {
      this.selectedCommitmentId.set(pubList[0].id);
    }
  }

  private loadStoredChains(): DuoChain[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load chains from storage', e);
    }
    return [];
  }

  private saveStoredChains(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._friendChains()));
    } catch (e) {
      console.error('Failed to save chains to storage', e);
    }
  }

  getInviteUrl(commitmentId?: string): string {
    const cid = commitmentId || this.selectedCommitmentId() || 'general';
    const baseUrl = window.location.origin;
    const inviteCode = btoa(`chain_${cid}_${Date.now()}`).substring(0, 10);
    return `${baseUrl}/chain?invite=${inviteCode}&cid=${cid}`;
  }

  async shareInvite(habitTitle: string): Promise<boolean> {
    const inviteUrl = this.getInviteUrl();
    const shareData = {
      title: 'Join my MehrChain Duo Habit!',
      text: `Let's chain our habits together on MehrChain! I'm tracking "${habitTitle}". Connect with me:`,
      url: inviteUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          return this.copyInviteToClipboard(inviteUrl);
        }
        return false;
      }
    } else {
      return this.copyInviteToClipboard(inviteUrl);
    }
  }

  async copyInviteToClipboard(url?: string): Promise<boolean> {
    const targetUrl = url || this.getInviteUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(targetUrl);
        return true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = targetUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();
        return success;
      }
    } catch (err) {
      console.error('Clipboard copy error:', err);
      return false;
    }
  }

  sendReaction(chainId: string, type: 'heart' | 'nudge'): void {
    this._friendChains.update((chains) =>
      chains.map((chain) => {
        if (chain.id === chainId) {
          return {
            ...chain,
            lastReaction: {
              type,
              from: 'You',
              message: type === 'heart' ? 'You sent heart reaction 💙' : 'You sent a nudge 🔔',
              timestamp: new Date(),
            },
          };
        }
        return chain;
      })
    );
    this.saveStoredChains();
  }

  removeChain(chainId: string): void {
    this._friendChains.update((list) => list.filter((c) => c.id !== chainId));
    this.saveStoredChains();
  }

  addDemoFriendChain(): void {
    const pubList = this.publicCommitments();
    const myHabit = pubList.length > 0 ? pubList[0].title : 'Save Water';
    const myHabitId = pubList.length > 0 ? pubList[0].id : 'demo_id';

    const demoChain: DuoChain = {
      id: `demo_chain_${Date.now()}`,
      partnerName: 'sara',
      myCommitmentId: myHabitId,
      myCommitmentTitle: myHabit,
      partnerCommitmentTitle: 'Morning Meditation (20m)',
      streak: 4,
      partnerCompletedToday: true,
      myCompletedToday: false,
      lastReaction: {
        type: 'heart',
        from: 'sara',
        message: 'Sara sent you love & encouragement! 💙',
        timestamp: new Date(),
      },
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    };

    this._friendChains.update((list) => [demoChain, ...list.filter((c) => c.partnerName !== 'sara')]);
    this.saveStoredChains();
  }

  togglePartnerToday(chainId: string): void {
    this._friendChains.update((chains) =>
      chains.map((chain) => {
        if (chain.id === chainId) {
          const next = !chain.partnerCompletedToday;
          return {
            ...chain,
            partnerCompletedToday: next,
            streak: next ? chain.streak + 1 : Math.max(1, chain.streak - 1),
          };
        }
        return chain;
      })
    );
    this.saveStoredChains();
  }
}
