import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { ChainConnection, ChainInvite } from '@mehrchain/shared-data';
import { CommitmentService } from './commitment.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface HabitChain {
  id: string;
  myCommitmentId: string;
  myCommitmentTitle: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerCommitmentTitle: string;
  partnerCategory?: 'health' | 'growth' | 'community' | 'environment' | string;
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

export type DuoChain = HabitChain;

export interface ChainInvitePayload {
  inviteCode: string;
  inviterName: string;
  habitTitle: string;
  category?: 'health' | 'growth' | 'community' | 'environment';
  commitmentId?: string;
}

const CONNECTIONS_STORAGE_PREFIX = 'mehrchain_chain_connections_';
const LAST_VISIT_STORAGE_PREFIX = 'mehrchain_chain_last_visit_';

export function isRemoteToken(token: string | null): boolean {
  if (!token) return false;
  return !token.startsWith('local_') && !token.startsWith('mock_');
}

@Injectable({
  providedIn: 'root',
})
export class ChainService {
  private http = inject(HttpClient);
  private commitmentService = inject(CommitmentService);
  private authService = inject(AuthService);

  private readonly _connections = signal<ChainConnection[]>([]);
  readonly connections = computed(() => this._connections());
  readonly hasUnread = signal<boolean>(false);
  readonly lastVisitAt = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);

  // Active commitment selection for invite in UI
  readonly selectedCommitmentId = signal<string>('');

  // Only public commitments are eligible to be chained
  readonly publicCommitments = computed(() =>
    this.commitmentService.commitments().filter((c) => c.isPublic === true)
  );

  // Active connections (excluding disconnected)
  readonly activeConnections = computed(() =>
    this._connections().filter((c) => c.status !== 'DISCONNECTED')
  );

  // Backwards compatibility for components still referencing friendChains
  readonly friendChains = computed<HabitChain[]>(() => {
    return this.activeConnections().map((conn) => {
      const partnerLastCompleted = conn.partnerCommitment?.lastCompletedDate;
      let completedToday = false;
      if (partnerLastCompleted) {
        const compDate = new Date(partnerLastCompleted).toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        completedToday = compDate === todayStr;
      }

      return {
        id: conn.id,
        myCommitmentId: conn.userCommitmentId,
        myCommitmentTitle: 'My Habit',
        partnerName: conn.partner?.name || conn.partner?.username || 'Partner',
        partnerCommitmentTitle: conn.partnerCommitment?.title || 'Habit',
        partnerCategory: conn.partnerCommitment?.category as any,
        streak: 0,
        partnerCompletedToday: completedToday,
        partnerBroadcastedToday: false,
        myCompletedToday: false,
        lastReaction: conn.heartSent
          ? {
              type: 'heart',
              from: 'You',
              timestamp: conn.lastPartnerActivityAt || conn.createdAt,
            }
          : undefined,
        createdAt: conn.createdAt,
      };
    });
  });

  private get userConnectionsKey(): string {
    const user = this.authService.currentUser();
    return `${CONNECTIONS_STORAGE_PREFIX}${user ? user.id : 'default'}`;
  }

  private get userLastVisitKey(): string {
    const user = this.authService.currentUser();
    return `${LAST_VISIT_STORAGE_PREFIX}${user ? user.id : 'default'}`;
  }

  constructor() {
    // React to user change
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadLocalCache();
        this.loadConnections();
      } else {
        this._connections.set([]);
        this.hasUnread.set(false);
      }
    });

    // Auto-select first public commitment
    effect(() => {
      const pubList = this.publicCommitments();
      const current = this.selectedCommitmentId();
      if (pubList.length > 0 && (!current || !pubList.some((c) => c.id === current))) {
        this.selectedCommitmentId.set(pubList[0].id);
      }
    });
  }

  private loadLocalCache(): void {
    try {
      const raw = localStorage.getItem(this.userConnectionsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this._connections.set(parsed);
        }
      }
      const lastVisit = localStorage.getItem(this.userLastVisitKey);
      this.lastVisitAt.set(lastVisit);
      this.checkUnread();
    } catch (e) {
      console.error('[ChainService] Failed to load local cache', e);
    }
  }

  private saveLocalCache(connections: ChainConnection[]): void {
    try {
      localStorage.setItem(this.userConnectionsKey, JSON.stringify(connections));
    } catch (e) {
      console.error('[ChainService] Failed to save local cache', e);
    }
  }

  async loadConnections(): Promise<ChainConnection[]> {
    const token = this.authService.getToken();
    if (!isRemoteToken(token)) {
      this.checkUnread();
      return this._connections();
    }

    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<ChainConnection[]>(`${environment.apiUrl}/chain/connections`)
      );
      this._connections.set(res || []);
      this.saveLocalCache(res || []);
      this.checkUnread();
      return res || [];
    } catch (error) {
      console.warn('[ChainService] Failed to fetch remote connections, using cache', error);
      return this._connections();
    } finally {
      this.isLoading.set(false);
    }
  }

  async sendHeart(connectionId: string): Promise<ChainConnection | null> {
    // Optimistic update
    const current = this._connections();
    let toggledState = false;
    const updated = current.map((c) => {
      if (c.id === connectionId) {
        toggledState = !c.heartSent;
        return { ...c, heartSent: toggledState };
      }
      return c;
    });
    this._connections.set(updated);
    this.saveLocalCache(updated);

    const token = this.authService.getToken();
    if (isRemoteToken(token)) {
      try {
        const res = await firstValueFrom(
          this.http.post<ChainConnection>(
            `${environment.apiUrl}/chain/connections/${connectionId}/heart`,
            {}
          )
        );
        return res;
      } catch (error) {
        console.error('[ChainService] Failed to sync heart to backend', error);
      }
    }
    return updated.find((c) => c.id === connectionId) || null;
  }

  async sendNudge(connectionId: string): Promise<ChainConnection | null> {
    const now = new Date().toISOString();
    const current = this._connections();
    const updated = current.map((c) => {
      if (c.id === connectionId) {
        return { ...c, lastNudgeSentAt: now };
      }
      return c;
    });
    this._connections.set(updated);
    this.saveLocalCache(updated);

    const token = this.authService.getToken();
    if (isRemoteToken(token)) {
      try {
        const res = await firstValueFrom(
          this.http.post<ChainConnection>(
            `${environment.apiUrl}/chain/connections/${connectionId}/nudge`,
            {}
          )
        );
        return res;
      } catch (error) {
        console.error('[ChainService] Failed to sync nudge to backend', error);
        throw error;
      }
    }
    return updated.find((c) => c.id === connectionId) || null;
  }

  async disconnect(connectionId: string): Promise<void> {
    const current = this._connections();
    const updated = current.map((c) => {
      if (c.id === connectionId) {
        return { ...c, status: 'DISCONNECTED' as const };
      }
      return c;
    });
    this._connections.set(updated);
    this.saveLocalCache(updated);

    const token = this.authService.getToken();
    if (isRemoteToken(token)) {
      try {
        await firstValueFrom(
          this.http.delete(`${environment.apiUrl}/chain/connections/${connectionId}`)
        );
      } catch (error) {
        console.error('[ChainService] Failed to delete connection on backend', error);
      }
    }
  }

  async createInvite(commitmentId: string): Promise<ChainInvite> {
    const token = this.authService.getToken();
    if (isRemoteToken(token)) {
      return firstValueFrom(
        this.http.post<ChainInvite>(`${environment.apiUrl}/chain/invite`, { commitmentId })
      );
    }

    // Local / Offline fallback mock
    const user = this.authService.currentUser();
    const commitment = this.commitmentService.commitments().find((c) => c.id === commitmentId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      id: `local_inv_${Date.now()}`,
      senderId: user ? user.id : 'user_local',
      senderCommitmentId: commitmentId,
      inviteCode: `inv_${Math.random().toString(36).substring(2, 9)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      sender: { username: user?.username || 'user', name: user?.name || 'User' },
      senderCommitment: {
        title: commitment?.title || 'Habit',
        category: commitment?.category || 'growth',
      },
    };
  }

  async getInvite(code: string): Promise<ChainInvite> {
    const token = this.authService.getToken();
    if (isRemoteToken(token)) {
      return firstValueFrom(
        this.http.get<ChainInvite>(`${environment.apiUrl}/chain/invite/${code}`)
      );
    }

    // Local fallback
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return {
      id: `local_inv_${code}`,
      senderId: 'mock_sender',
      senderCommitmentId: 'mock_comm',
      inviteCode: code,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      sender: { username: 'partner', name: 'Partner' },
      senderCommitment: { title: 'Reading Habit', category: 'growth' },
    };
  }

  async acceptInvite(
    inviteOrCode: string | Partial<ChainInvitePayload> | any,
    commitmentIdParam?: string
  ): Promise<any> {
    let code = typeof inviteOrCode === 'string' ? inviteOrCode : inviteOrCode?.inviteCode || 'code';
    let commitmentId =
      commitmentIdParam || (typeof inviteOrCode === 'object' ? inviteOrCode?.myCommitmentId || inviteOrCode?.commitmentId : '') || '';

    const token = this.authService.getToken();
    if (isRemoteToken(token) && code && commitmentId) {
      const res = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/chain/invite/${code}/accept`, { commitmentId })
      );
      await this.loadConnections();
      return res;
    }

    // Local fallback connection creation
    const user = this.authService.currentUser();
    const inviterName = typeof inviteOrCode === 'object' ? inviteOrCode.inviterName || 'Friend' : 'Friend';
    const habitTitle = typeof inviteOrCode === 'object' ? inviteOrCode.inviterHabitTitle || inviteOrCode.habitTitle || 'Partner Habit' : 'Partner Habit';
    const category = typeof inviteOrCode === 'object' ? inviteOrCode.inviterCategory || inviteOrCode.category || 'growth' : 'growth';

    const newConn: ChainConnection = {
      id: `local_conn_${Date.now()}`,
      userId: user ? user.id : 'user_local',
      partnerId: `partner_${Date.now()}`,
      userCommitmentId: commitmentId,
      partnerCommitmentId: `partner_comm_${Date.now()}`,
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      lastPartnerActivityAt: new Date().toISOString(),
      heartSent: false,
      createdAt: new Date().toISOString(),
      partner: { username: inviterName.toLowerCase(), name: inviterName },
      partnerCommitment: {
        title: habitTitle,
        category,
      },
    };

    const current = this._connections();
    const updated = [newConn, ...current];
    this._connections.set(updated);
    this.saveLocalCache(updated);

    const mapped = this.friendChains().find((c) => c.id === newConn.id);
    return mapped || { id: newConn.id, partnerName: inviterName };
  }

  checkUnread(): void {
    const lastVisit = this.lastVisitAt();
    if (!lastVisit) {
      const hasAnyActivity = this._connections().some((c) => c.lastPartnerActivityAt);
      this.hasUnread.set(hasAnyActivity);
      return;
    }

    const lastVisitTime = new Date(lastVisit).getTime();
    const hasNew = this._connections().some((c) => {
      if (!c.lastPartnerActivityAt) return false;
      return new Date(c.lastPartnerActivityAt).getTime() > lastVisitTime;
    });

    this.hasUnread.set(hasNew);
  }

  markAsRead(): void {
    const now = new Date().toISOString();
    this.lastVisitAt.set(now);
    try {
      localStorage.setItem(this.userLastVisitKey, now);
    } catch (e) {
      console.error('[ChainService] Failed to update last visit', e);
    }
    this.hasUnread.set(false);
  }

  // --- Helpers & UI Integration ---

  getInviteUrl(commitmentId?: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mehrchain.pages.dev';
    const activeCommitmentId = commitmentId || this.selectedCommitmentId();
    return `${origin}/chain?invite=${activeCommitmentId || 'general'}`;
  }

  parseInviteParams(params: any): ChainInvitePayload | null {
    if (!params || !params.invite) return null;
    return {
      inviteCode: params.invite,
      inviterName: params.inviter || 'A Friend',
      habitTitle: params.habit || 'Daily Habit',
      category: params.category || 'growth',
      commitmentId: params.invite,
    };
  }

  async shareInvite(habitTitle: string): Promise<boolean> {
    const url = this.getInviteUrl();
    const text = `Join my habit chain on MehrChain: "${habitTitle}" 🌟`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'MehrChain Invite', text, url });
        return true;
      } catch {
        return false;
      }
    }
    return this.copyInviteToClipboard(url);
  }

  async copyInviteToClipboard(url: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  ringBellBroadcast(commitmentId: string): { count: number } {
    const matching = this.activeConnections().filter((c) => c.userCommitmentId === commitmentId);
    return { count: matching.length };
  }

  getSupportersCount(commitmentId: string): number {
    return this.activeConnections().filter((c) => c.userCommitmentId === commitmentId).length;
  }

  getChainsForCommitment(commitmentId: string): HabitChain[] {
    return this.friendChains().filter((c) => c.myCommitmentId === commitmentId);
  }

  sendReaction(chainId: string, type: 'heart' | 'cheer' | 'nudge'): void {
    if (type === 'heart') {
      this.sendHeart(chainId);
    } else if (type === 'nudge') {
      this.sendNudge(chainId);
    }
  }

  addDemoFriendChain(): void {
    const pubList = this.publicCommitments();
    const commId = pubList.length > 0 ? pubList[0].id : 'demo_comm';
    this.acceptInvite({
      inviterName: 'sara',
      inviterHabitTitle: 'Morning Yoga',
      inviterCategory: 'health',
      myCommitmentId: commId,
    });
  }

  togglePartnerToday(chainId: string): void {
    const current = this._connections();
    const updated = current.map((c) => {
      if (c.id === chainId && c.partnerCommitment) {
        const isComp = !!c.partnerCommitment.lastCompletedDate;
        return {
          ...c,
          partnerCommitment: {
            ...c.partnerCommitment,
            lastCompletedDate: isComp ? null : new Date().toISOString(),
          },
        };
      }
      return c;
    });
    this._connections.set(updated);
    this.saveLocalCache(updated);
  }

  togglePartnerBroadcastToday(chainId: string): void {
    // No-op for minimal spec
  }

  removeChain(chainId: string): void {
    this.disconnect(chainId);
  }
}
