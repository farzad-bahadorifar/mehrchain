import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ChainConnection,
  ChainInvite,
  ChainDisconnectReceipt,
  DisconnectChainRequest,
} from '@mehrchain/shared-data';
import { CommitmentService } from './commitment.service';
import { AuthService } from './auth.service';
import { ColdStartService } from './cold-start.service';
import { ForegroundRefreshService } from './foreground-refresh.service';
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
  private coldStartService = inject(ColdStartService);

  private readonly _connections = signal<ChainConnection[]>([]);
  readonly connections = computed(() => this._connections());
  readonly hasUnread = signal<boolean>(false);
  readonly lastVisitAt = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly loadError = signal<string | null>(null);
  readonly supportStale = signal(true);
  readonly disconnectReceipts = signal<ChainDisconnectReceipt[]>([]);
  readonly receiptError = signal<string | null>(null);
  readonly dismissingReceipts = signal<ReadonlySet<string>>(new Set());
  private receiptRequest?: Promise<void>;
  private receiptVersion = 0;
  readonly pendingHeartTargets = signal<ReadonlySet<string>>(new Set());
  private readonly heartRequests = new Map<string, Promise<ChainConnection | null>>();
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private loadRequest?: { token: string; userId?: string; promise: Promise<ChainConnection[]> };
  private mutationVersion = 0;
  private sessionVersion = 0;
  private destroyed = false;

  // Active commitment selection for invite in UI
  readonly selectedCommitmentId = signal<string>('');

  // Only public commitments are eligible to be chained
  readonly publicCommitments = computed(() =>
    this.commitmentService.commitments().filter((c) => c.isPublic === true),
  );

  // Active connections (excluding disconnected)
  readonly activeConnections = computed(() =>
    this._connections().filter(
      (c) =>
        c.status !== 'DISCONNECTED' &&
        c.status !== 'DORMANT' &&
        c.status !== 'FADING' &&
        this.publicCommitments().some((h) => h.id === c.userCommitmentId),
    ),
  );

  // Backwards compatibility for components still referencing friendChains
  readonly friendChains = computed<HabitChain[]>(() => {
    return this.activeConnections().map((conn) => {
      const completedToday = conn.partnerCommitment?.isCompletedToday ?? false;

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
        lastReaction:
          !this.supportStale() && conn.heartSent
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
    const destroyRef = inject(DestroyRef);
    inject(ForegroundRefreshService).onResume(() => {
      this.supportStale.set(true);
      void this.loadConnections();
    }, destroyRef);
    destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.sessionVersion++;
      clearTimeout(this.refreshTimer);
    });
    // React to user change
    effect(() => {
      const user = this.authService.currentUser();
      untracked(() => {
        this.sessionVersion++;
        this.mutationVersion++;
        clearTimeout(this.refreshTimer);
        this.loadRequest = undefined;
        this.receiptRequest = undefined;
        this.receiptVersion++;
        this.disconnectReceipts.set([]);
        this.receiptError.set(null);
        this.dismissingReceipts.set(new Set());
        this.heartRequests.clear();
        this.pendingHeartTargets.set(new Set());
        this.supportStale.set(true);
        this.loadError.set(null);
        this.isLoading.set(false);
      });
      if (user) {
        untracked(() => {
          this._connections.set([]);
          this.loadLocalCache();
          void this.loadConnections();
        });
      } else {
        this._connections.set([]);
        this.hasUnread.set(false);
        this.lastVisitAt.set(null);
        this.selectedCommitmentId.set('');
      }
    });

    // Auto-select first public commitment
    effect(() => {
      const pubList = this.publicCommitments();
      const current = this.selectedCommitmentId();
      if (pubList.length > 0 && (!current || !pubList.some((c) => c.id === current))) {
        this.selectedCommitmentId.set(pubList[0].id);
      }
      if (!pubList.length) this.selectedCommitmentId.set('');
    });

    // Discard confirmed unavailable local endpoints, including cached rows. A later
    // restore must not make those connections visible again before new acceptance.
    effect(() => {
      const unavailable = new Set([
        ...this.commitmentService.archivedCommitments().map((h) => h.id),
        ...this.commitmentService
          .commitments()
          .filter((h) => !h.isPublic)
          .map((h) => h.id),
      ]);
      const current = this._connections();
      const kept = current.filter((c) => !unavailable.has(c.userCommitmentId));
      if (kept.length !== current.length)
        untracked(() => {
          this._connections.set(kept);
          this.saveLocalCache(kept);
        });
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

  private scheduleExpiry(connections: ChainConnection[], elapsed: number): void {
    clearTimeout(this.refreshTimer);
    const deadlines = connections.flatMap((c) => [c.calendar, c.partnerCalendar]);
    const delays = deadlines.map((calendar) =>
      calendar ? Date.parse(calendar.nextDayAt) - Date.parse(calendar.serverNow) - elapsed : NaN,
    );
    const valid = delays.every(Number.isFinite);
    const delay = delays.length && valid ? Math.min(...delays) : 60000;
    this.supportStale.set(!valid || delay <= 0);
    if (!valid)
      this.loadError.set('Could not refresh daily support. Please update the app and retry.');
    if (!connections.length) return;
    this.refreshTimer = setTimeout(
      () => {
        this.supportStale.set(true);
        void this.loadConnections();
      },
      Math.max(1000, delay),
    );
  }

  loadConnections(): Promise<ChainConnection[]> {
    if (this.destroyed) return Promise.resolve([]);
    const token = this.authService.getToken();
    const userId = this.authService.currentUser()?.id;
    if (!isRemoteToken(token)) {
      this.supportStale.set(environment.production);
      this.checkUnread();
      return Promise.resolve(this._connections());
    }
    if (this.loadRequest?.token === token && this.loadRequest.userId === userId)
      return this.loadRequest.promise;
    if (
      (typeof document !== 'undefined' && document.visibilityState === 'hidden') ||
      (typeof navigator !== 'undefined' && navigator.onLine === false)
    ) {
      this.supportStale.set(true);
      return Promise.resolve(this._connections());
    }
    clearTimeout(this.refreshTimer);
    void this.loadDisconnectReceipts();
    const session = this.sessionVersion;
    const version = this.mutationVersion;
    const started = performance.now();
    this.isLoading.set(true);
    this.loadError.set(null);
    this.coldStartService.startRequest();
    const promise = (async () => {
      try {
        const res = await firstValueFrom(
          this.http.get<ChainConnection[]>(`${environment.apiUrl}/chain/connections`, {
            params: { 'ngsw-bypass': 'true' },
          }),
        );
        if (
          this.destroyed ||
          session !== this.sessionVersion ||
          this.authService.currentUser()?.id !== userId ||
          this.authService.getToken() !== token
        )
          return [];
        if (version !== this.mutationVersion) {
          this.supportStale.set(true);
          clearTimeout(this.refreshTimer);
          this.refreshTimer = setTimeout(() => void this.loadConnections(), 1000);
          return this._connections();
        }
        if (!Array.isArray(res)) throw new Error('Invalid chain response');
        this._connections.set(res);
        this.saveLocalCache(res || []);
        this.scheduleExpiry(res || [], performance.now() - started);
        this.checkUnread();
        return res || [];
      } catch (error) {
        if (
          session === this.sessionVersion &&
          this.authService.currentUser()?.id === userId &&
          this.authService.getToken() === token
        ) {
          this.supportStale.set(true);
          this.loadError.set('Could not refresh your chain. Please retry.');
          clearTimeout(this.refreshTimer);
          this.refreshTimer = setTimeout(() => void this.loadConnections(), 60000);
        }
        return this._connections();
      } finally {
        this.coldStartService.finishRequest();
      }
    })().finally(() => {
      if (this.loadRequest?.promise === promise) {
        if (session === this.sessionVersion) this.isLoading.set(false);
        this.loadRequest = undefined;
      }
    });
    this.loadRequest = { token: token!, userId, promise };
    return promise;
  }

  private async writeConnection(
    connectionId: string,
    action: 'heart' | 'disconnect',
    disconnectRequest?: DisconnectChainRequest,
    completionId?: string,
  ): Promise<ChainConnection | null> {
    const token = this.authService.getToken();
    const userId = this.authService.currentUser()?.id;
    const session = this.sessionVersion;
    const generationId = this._connections().find(
      (connection) => connection.id === connectionId,
    )?.generationId;
    this.mutationVersion++;
    if (isRemoteToken(token)) {
      const url = `${environment.apiUrl}/chain/connections/${connectionId}`;
      const response = await firstValueFrom(
        action === 'disconnect'
          ? this.http.delete<ChainConnection>(url, { body: disconnectRequest })
          : this.http.post<ChainConnection>(`${url}/${action}`, { completionId }),
      );
      if (
        session !== this.sessionVersion ||
        this.authService.currentUser()?.id !== userId ||
        this.authService.getToken() !== token
      )
        throw new Error('Your session changed. Please reload.');
      const current = this._connections().find((c) => c.id === connectionId);
      if (
        action === 'heart' &&
        (!current ||
          current.status === 'DISCONNECTED' ||
          current.generationId !== generationId ||
          response?.generationId !== generationId)
      )
        throw new Error('This chain has changed. Please refresh.');
      if (
        action === 'disconnect' &&
        current?.generationId &&
        current.generationId !== disconnectRequest?.generationId
      )
        throw new Error('This chain has changed. Please refresh.');
      if (
        response?.id !== connectionId ||
        (action === 'heart' &&
          !response.supportCards?.some(
            (card) => card.completionId === completionId && !!card.sentAt,
          )) ||
        (action === 'disconnect' && response.status !== 'DISCONNECTED')
      )
        throw new Error('The server did not confirm the change. Please refresh and retry.');
      this.mutationVersion++;
      const updated = this._connections().map((c) => {
        if (c.id === connectionId && action === 'disconnect') return { ...c, ...response };
        if (action !== 'heart' || c.status === 'DISCONNECTED') return c;
        const confirmed = response.supportCards?.find((card) => card.completionId === completionId);
        return {
          ...c,
          ...(c.partnerCommitmentId === response.partnerCommitmentId && {
            heartSent: true,
            heartSentAt: response.heartSentAt,
            partnerCalendar: response.partnerCalendar,
            supportCards: c.supportCards?.map((card) =>
              card.completionId === completionId
                ? confirmed!
                : { ...card, allowanceUsed: !card.sentAt },
            ),
          }),
          ...(c.userCommitmentId === response.userCommitmentId && {
            receivedHeartCount: response.receivedHeartCount,
            calendar: response.calendar,
          }),
        };
      });
      this._connections.set(updated);
      this.saveLocalCache(updated);
      return response;
    }
    if (environment.production) throw new Error('Please sign in to use your chain.');
    const updated = this._connections().map((c) =>
      c.id !== connectionId
        ? c
        : action === 'heart'
          ? {
              ...c,
              supportCards: c.supportCards?.map((card) =>
                card.completionId === completionId
                  ? { ...card, sentAt: card.sentAt ?? new Date().toISOString() }
                  : card,
              ),
            }
          : { ...c, status: 'DISCONNECTED' as const },
    );
    this._connections.set(updated);
    this.saveLocalCache(updated);
    return updated.find((c) => c.id === connectionId) || null;
  }

  sendHeart(id: string, completionId: string): Promise<ChainConnection | null> {
    const connection = this._connections().find((c) => c.id === id);
    const card = connection?.supportCards?.find((entry) => entry.completionId === completionId);
    if (!connection || !card || card.allowanceUsed || card.sentAt || this.supportStale())
      return Promise.reject(new Error('Please refresh your chain.'));
    const target = connection.partnerCommitmentId;
    const existing = this.heartRequests.get(completionId);
    if (existing) return existing;
    if (this.pendingHeartTargets().has(target))
      return Promise.reject(new Error('Another heart is being saved for this habit.'));
    const session = this.sessionVersion;
    this.pendingHeartTargets.update((ids) => new Set([...ids, target]));
    const request = this.writeConnection(id, 'heart', undefined, completionId).finally(() => {
      if (session !== this.sessionVersion || this.heartRequests.get(completionId) !== request)
        return;
      this.heartRequests.delete(completionId);
      this.pendingHeartTargets.update((ids) => {
        const next = new Set(ids);
        next.delete(target);
        return next;
      });
    });
    this.heartRequests.set(completionId, request);
    return request;
  }
  async disconnect(id: string, request: DisconnectChainRequest): Promise<void> {
    await this.writeConnection(id, 'disconnect', request);
    // Other cards can repeat this habit's received aggregate.
    // Hide that snapshot until a fresh read confirms the remaining support.
    this.supportStale.set(true);
    void this.loadConnections();
  }

  loadDisconnectReceipts(): Promise<void> {
    const token = this.authService.getToken();
    const userId = this.authService.currentUser()?.id;
    if (this.destroyed || !isRemoteToken(token)) return Promise.resolve();
    if (this.receiptRequest) return this.receiptRequest;
    const session = this.sessionVersion;
    const version = this.receiptVersion;
    const current = () =>
      !this.destroyed &&
      session === this.sessionVersion &&
      token === this.authService.getToken() &&
      userId === this.authService.currentUser()?.id;
    const request = (async () => {
      try {
        const receipts = await firstValueFrom(
          this.http.get<ChainDisconnectReceipt[]>(
            `${environment.apiUrl}/chain/disconnect-receipts`,
            { params: { 'ngsw-bypass': 'true' } },
          ),
        );
        if (!current() || version !== this.receiptVersion) return;
        if (!Array.isArray(receipts)) throw new Error('Invalid receipt response');
        this.disconnectReceipts.set(receipts);
        this.receiptError.set(null);
        this.checkUnread();
      } catch {
        if (current()) this.receiptError.set('Could not load private chain updates. Please retry.');
      }
    })().finally(() => {
      if (this.receiptRequest === request) this.receiptRequest = undefined;
    });
    this.receiptRequest = request;
    return request;
  }

  async dismissDisconnectReceipt(id: string): Promise<void> {
    if (this.dismissingReceipts().has(id)) return;
    const token = this.authService.getToken();
    const userId = this.authService.currentUser()?.id;
    const session = this.sessionVersion;
    if (!isRemoteToken(token)) return;
    const current = () =>
      !this.destroyed &&
      session === this.sessionVersion &&
      token === this.authService.getToken() &&
      userId === this.authService.currentUser()?.id;
    this.receiptVersion++;
    this.dismissingReceipts.update((ids) => new Set([...ids, id]));
    this.receiptError.set(null);
    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/chain/disconnect-receipts/${encodeURIComponent(id)}/dismiss`,
          {},
        ),
      );
      if (!current()) return;
      this.receiptVersion++;
      this.disconnectReceipts.update((receipts) => receipts.filter((r) => r.id !== id));
      this.checkUnread();
      // Wait out any older read before fetching the next page of pending updates.
      await this.receiptRequest;
      if (current()) void this.loadDisconnectReceipts();
    } catch {
      if (current()) this.receiptError.set('Could not dismiss this update. Please retry.');
    } finally {
      if (current())
        this.dismissingReceipts.update((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
    }
  }

  async createInvite(commitmentId: string): Promise<ChainInvite> {
    const token = this.authService.getToken();
    if (isRemoteToken(token)) {
      return firstValueFrom(
        this.http.post<ChainInvite>(`${environment.apiUrl}/chain/invite`, { commitmentId }),
      );
    }

    if (environment.production) throw new Error('Please sign in to create an invite.');
    // Development demo only
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
    if (!code) throw new Error('Invalid invite link.');
    // Invite lookup is a public route, including before a user signs in.
    return firstValueFrom(
      this.http.get<ChainInvite>(`${environment.apiUrl}/chain/invite/${encodeURIComponent(code)}`, {
        params: { 'ngsw-bypass': 'true' },
      }),
    );
  }

  async acceptInvite(
    inviteOrCode: string | Partial<ChainInvitePayload> | any,
    commitmentIdParam?: string,
  ): Promise<any> {
    let code = typeof inviteOrCode === 'string' ? inviteOrCode : inviteOrCode?.inviteCode || '';
    let commitmentId =
      commitmentIdParam ||
      (typeof inviteOrCode === 'object'
        ? inviteOrCode?.myCommitmentId || inviteOrCode?.commitmentId
        : '') ||
      '';

    const token = this.authService.getToken();
    if (isRemoteToken(token) && code && commitmentId) {
      const res = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/chain/invite/${code}/accept`, { commitmentId }),
      );
      await this.loadConnections();
      return res;
    }

    if (isRemoteToken(token) || environment.production)
      throw new Error('A valid invite code and saved habit are required.');
    // Development demo only
    const user = this.authService.currentUser();
    const inviterName =
      typeof inviteOrCode === 'object' ? inviteOrCode.inviterName || 'Friend' : 'Friend';
    const habitTitle =
      typeof inviteOrCode === 'object'
        ? inviteOrCode.inviterHabitTitle || inviteOrCode.habitTitle || 'Partner Habit'
        : 'Partner Habit';
    const category =
      typeof inviteOrCode === 'object'
        ? inviteOrCode.inviterCategory || inviteOrCode.category || 'growth'
        : 'growth';

    const newConn: ChainConnection = {
      id: `local_conn_${crypto.randomUUID()}`,
      generationId: crypto.randomUUID(),
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
    if (this.disconnectReceipts().length) {
      this.hasUnread.set(true);
      return;
    }
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
    this.hasUnread.set(this.disconnectReceipts().length > 0);
  }

  // --- Helpers & UI Integration ---

  getBaseAppUrl(): string {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const isNativeOrLocalhost =
        !origin ||
        origin.startsWith('capacitor://') ||
        origin.startsWith('ionic://') ||
        origin.startsWith('file://') ||
        origin === 'https://localhost' ||
        origin === 'http://localhost';

      if (!isNativeOrLocalhost && !origin.includes('localhost')) {
        return origin;
      }
    }
    return (environment as any).appUrl || 'https://mehrchain.pages.dev';
  }

  getInviteUrl(inviteCode: string): string {
    if (!inviteCode) throw new Error('Create an invite before sharing it.');
    return `${this.getBaseAppUrl()}/chain?invite=${encodeURIComponent(inviteCode)}`;
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

  async shareInvite(habitTitle: string, commitmentId?: string): Promise<boolean> {
    if (!commitmentId) throw new Error('Select a public habit first.');
    const invite = await this.createInvite(commitmentId);
    const url = this.getInviteUrl(invite.inviteCode);
    const text = `Join my habit chain on MehrChain: "${habitTitle}"`;
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

  getReceivedHeartCount(commitmentId: string): number {
    if (this.supportStale()) return 0;
    // Each connection repeats the own-habit aggregate. Never sum duplicate rows.
    return Math.max(
      0,
      ...this.activeConnections()
        .filter((c) => c.userCommitmentId === commitmentId)
        .map((c) => c.receivedHeartCount || 0),
    );
  }

  getChainsForCommitment(commitmentId: string): HabitChain[] {
    return this.friendChains().filter((c) => c.myCommitmentId === commitmentId);
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

  removeChain(chainId: string, request: DisconnectChainRequest): Promise<void> {
    return this.disconnect(chainId, request);
  }
}
