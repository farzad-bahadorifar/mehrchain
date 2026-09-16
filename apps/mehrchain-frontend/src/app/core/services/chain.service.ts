import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CommitmentService } from './commitment.service';
import { AuthService } from './auth.service';
import { MeroCustomizationService } from './mero-customization.service';

export interface HabitChain {
  id: string;
  myCommitmentId: string;
  myCommitmentTitle: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerCommitmentTitle: string;
  partnerCategory?: 'health' | 'growth' | 'community' | 'environment';
  streak: number;
  partnerCompletedToday: boolean;
  partnerBroadcastedToday: boolean;
  myCompletedToday: boolean;
  lastReaction?: {
    type: 'heart' | 'cheer' | 'nudge';
    from: string;
    message?: string;
    timestamp: Date | string;
  };
  createdAt: Date | string;
}

// Backwards compatibility alias
export type DuoChain = HabitChain;

export interface ChainInvitePayload {
  inviteCode: string;
  inviterName: string;
  habitTitle: string;
  category?: 'health' | 'growth' | 'community' | 'environment';
  commitmentId?: string;
}

const STORAGE_PREFIX = 'mehrchain_chains_';

@Injectable({
  providedIn: 'root',
})
export class ChainService {
  private commitmentService = inject(CommitmentService);
  private authService = inject(AuthService);
  private customizationService = inject(MeroCustomizationService);

  private currentStorageKey = computed(() => {
    const user = this.authService.currentUser();
    return `${STORAGE_PREFIX}${user ? user.id : 'default'}`;
  });

  // Stored connected friend chains
  private _friendChains = signal<HabitChain[]>([]);

  readonly friendChains = computed(() => this._friendChains());

  // Only public commitments are eligible to be chained
  readonly publicCommitments = computed(() =>
    this.commitmentService.commitments().filter((c) => c.isPublic === true)
  );

  // Active commitment selection for invite in UI
  readonly selectedCommitmentId = signal<string>('');

  constructor() {
    // Initial load
    this.reloadChains();

    // Reload chains when user session switches
    effect(() => {
      const key = this.currentStorageKey();
      this.reloadChains(key);
    });

    // Auto-select first public commitment if available
    effect(() => {
      const pubList = this.publicCommitments();
      const current = this.selectedCommitmentId();
      if (pubList.length > 0 && (!current || !pubList.some((c) => c.id === current))) {
        this.selectedCommitmentId.set(pubList[0].id);
      }
    });
  }

  private reloadChains(storageKey?: string): void {
    const key = storageKey || this.currentStorageKey();
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this._friendChains.set(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('[ChainService] Failed to load chains from storage', e);
    }
    this._friendChains.set([]);
  }

  private saveStoredChains(): void {
    try {
      const key = this.currentStorageKey();
      localStorage.setItem(key, JSON.stringify(this._friendChains()));
    } catch (e) {
      console.error('[ChainService] Failed to save chains to storage', e);
    }
  }

  /**
   * Returns all chains linked to a specific local commitment (1:N support)
   */
  getChainsForCommitment(commitmentId: string): HabitChain[] {
    return this._friendChains().filter((c) => c.myCommitmentId === commitmentId);
  }

  /**
   * Returns the count of supporters chained to a specific commitment
   */
  getSupportersCount(commitmentId: string): number {
    return this.getChainsForCommitment(commitmentId).length;
  }

  /**
   * Generates a shareable invite URL containing inviter and habit details
   */
  getInviteUrl(commitmentId?: string): string {
    const cid = commitmentId || this.selectedCommitmentId() || 'general';
    const habit = this.publicCommitments().find((c) => c.id === cid);
    const habitTitle = habit ? encodeURIComponent(habit.title) : 'Habit';
    const habitCategory = habit ? encodeURIComponent(habit.category) : 'growth';

    const inviterName = encodeURIComponent(
      this.authService.currentUser()?.name ||
      this.authService.currentUser()?.username ||
      this.customizationService.nickname() ||
      'Friend'
    );

    const baseUrl = window.location.origin;
    const inviteCode = btoa(`chain_${cid}_${Date.now()}`).substring(0, 10);

    return `${baseUrl}/chain?invite=${inviteCode}&cid=${cid}&u=${inviterName}&title=${habitTitle}&cat=${habitCategory}`;
  }

  /**
   * Parses an invite payload from search params or object
   */
  parseInviteParams(params: { [key: string]: string | undefined }): ChainInvitePayload | null {
    const inviteCode = params['invite'];
    if (!inviteCode) return null;

    return {
      inviteCode,
      inviterName: params['u'] ? decodeURIComponent(params['u']) : 'A friend',
      habitTitle: params['title'] ? decodeURIComponent(params['title']) : 'Daily Habit',
      category: (params['cat'] as any) || 'growth',
      commitmentId: params['cid'],
    };
  }

  /**
   * Connects incoming invite habit with a local public habit
   */
  acceptInvite(payload: {
    inviterName: string;
    inviterHabitTitle: string;
    inviterCategory?: 'health' | 'growth' | 'community' | 'environment';
    myCommitmentId: string;
    myCommitmentTitle: string;
  }): HabitChain {
    const newChain: HabitChain = {
      id: `chain_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      myCommitmentId: payload.myCommitmentId,
      myCommitmentTitle: payload.myCommitmentTitle,
      partnerName: payload.inviterName,
      partnerCommitmentTitle: payload.inviterHabitTitle,
      partnerCategory: payload.inviterCategory || 'growth',
      streak: 1,
      partnerCompletedToday: true,
      partnerBroadcastedToday: true,
      myCompletedToday: false,
      lastReaction: {
        type: 'heart',
        from: payload.inviterName,
        message: `${payload.inviterName} linked journeys with you! 💙`,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };

    this._friendChains.update((list) => [newChain, ...list]);
    this.saveStoredChains();
    return newChain;
  }

  /**
   * "Ring the Bell" Broadcast: Sends completion broadcast to all supporters chained to this habit.
   */
  ringBellBroadcast(commitmentId: string): { count: number; habitTitle: string } {
    const affected = this._friendChains().filter((c) => c.myCommitmentId === commitmentId);
    const myName = this.authService.currentUser()?.name || this.customizationService.nickname() || 'You';
    const habit = this.commitmentService.commitments().find((c) => c.id === commitmentId);
    const habitTitle = habit ? habit.title : 'Daily Habit';

    this._friendChains.update((chains) =>
      chains.map((chain) => {
        if (chain.myCommitmentId === commitmentId) {
          return {
            ...chain,
            myCompletedToday: true,
            lastReaction: {
              type: 'cheer',
              from: myName,
              message: `${myName} rang the bell today for "${habitTitle}"! 🔔✨`,
              timestamp: new Date().toISOString(),
            },
          };
        }
        return chain;
      })
    );

    this.saveStoredChains();
    return { count: affected.length, habitTitle };
  }

  /**
   * Sends heart or cheering reaction to a connected friend
   */
  sendReaction(chainId: string, type: 'heart' | 'cheer' | 'nudge'): void {
    const myName = this.authService.currentUser()?.name || this.customizationService.nickname() || 'You';

    let reactionMsg = `${myName} sent warm heart energy! 💙`;
    if (type === 'cheer') {
      reactionMsg = `${myName} cheered for your progress! 🌟`;
    } else if (type === 'nudge') {
      reactionMsg = `${myName} sent a gentle reminder! 🔔`;
    }

    this._friendChains.update((chains) =>
      chains.map((chain) => {
        if (chain.id === chainId) {
          return {
            ...chain,
            lastReaction: {
              type,
              from: myName,
              message: reactionMsg,
              timestamp: new Date().toISOString(),
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

    const demoChain: HabitChain = {
      id: `demo_chain_${Date.now()}`,
      partnerName: 'sara',
      myCommitmentId: myHabitId,
      myCommitmentTitle: myHabit,
      partnerCommitmentTitle: 'Morning Meditation (20m)',
      partnerCategory: 'growth',
      streak: 5,
      partnerCompletedToday: true,
      partnerBroadcastedToday: true,
      myCompletedToday: false,
      lastReaction: {
        type: 'heart',
        from: 'sara',
        message: 'Sara rang the bell & sent you love! 💙✨',
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
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
            partnerBroadcastedToday: next ? chain.partnerBroadcastedToday : false,
            streak: next ? chain.streak + 1 : Math.max(1, chain.streak - 1),
          };
        }
        return chain;
      })
    );
    this.saveStoredChains();
  }

  togglePartnerBroadcastToday(chainId: string): void {
    this._friendChains.update((chains) =>
      chains.map((chain) => {
        if (chain.id === chainId) {
          const nextBroadcast = !chain.partnerBroadcastedToday;
          return {
            ...chain,
            partnerCompletedToday: true,
            partnerBroadcastedToday: nextBroadcast,
          };
        }
        return chain;
      })
    );
    this.saveStoredChains();
  }

  async shareInvite(habitTitle: string): Promise<boolean> {
    const inviteUrl = this.getInviteUrl();
    const shareData = {
      title: 'Join my MehrChain Habit Support Network!',
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
      console.error('[ChainService] Clipboard copy error:', err);
      return false;
    }
  }
}
