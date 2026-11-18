import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChainService } from './chain.service';
import { CommitmentService } from './commitment.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { ChainConnection } from '@mehrchain/shared-data';

const completion = {
  completionId: 'event',
  completedAt: '2026-10-18T00:00:00Z',
  sentAt: null,
  allowanceUsed: false,
};
const confirmed = { ...completion, sentAt: '2026-10-18T01:00:00Z' };

describe('ChainService (Frontend Hybrid)', () => {
  let service: ChainService;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ChainService,
        CommitmentService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ChainService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    // Connection refreshes independently check the private receipt inbox.
    httpMock
      .match((req) => req.url.endsWith('/chain/disconnect-receipts'))
      .forEach((req) => req.flush([]));
    httpMock.verify();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should be created with initial empty state', () => {
    expect(service).toBeTruthy();
    expect(service.connections()).toEqual([]);
    expect(service.hasUnread()).toBe(false);
  });

  it('should fetch remote connections and update cache when remote token is present', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('jwt_valid_remote_token');
    vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date().toISOString(),
    });

    const mockConnections: ChainConnection[] = [
      {
        id: 'conn-1',
        userId: 'user-1',
        partnerId: 'user-2',
        userCommitmentId: 'comm-1',
        partnerCommitmentId: 'comm-2',
        status: 'ACTIVE',
        consecutiveMissedDays: 0,
        heartSent: false,
        createdAt: new Date().toISOString(),
        partner: { username: 'alice', name: 'Alice' },
        partnerCommitment: { title: 'Exercise', category: 'health' },
      },
    ];

    const loadPromise = service.loadConnections();

    const req = httpMock.expectOne(`${environment.apiUrl}/chain/connections?ngsw-bypass=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConnections);

    const result = await loadPromise;
    expect(result).toEqual(mockConnections);
    expect(service.connections()).toEqual(mockConnections);
  });

  it('should confirm heart sending and share pending requests across duplicate links', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('jwt_valid_remote_token');
    vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date().toISOString(),
    });

    const mockConnection: ChainConnection = {
      id: 'conn-1',
      userId: 'user-1',
      partnerId: 'user-2',
      userCommitmentId: 'comm-1',
      partnerCommitmentId: 'comm-2',
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      heartSent: false,
      createdAt: new Date().toISOString(),
    };

    mockConnection.supportCards = [completion];
    (service as any)._connections.set([mockConnection, { ...mockConnection, id: 'duplicate' }]);
    service.supportStale.set(false);

    const heartPromise = service.sendHeart('conn-1', 'event');

    // No success before confirmation.
    expect(service.connections()[0].heartSent).toBe(false);
    expect(service.sendHeart('duplicate', 'event')).toBe(heartPromise);
    expect(service.pendingHeartTargets().has('comm-2')).toBe(true);

    const req = httpMock.expectOne(`${environment.apiUrl}/chain/connections/conn-1/heart`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ completionId: 'event' });
    req.flush({ ...mockConnection, heartSent: true, supportCards: [confirmed] });

    await heartPromise;
    expect(service.connections().every((c) => c.heartSent)).toBe(true);
    expect(service.pendingHeartTargets().size).toBe(0);
  });

  it('keeps failure retryable and never shows an unsaved heart', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('remote-token');
    const connection = {
      id: 'c',
      userId: 'me',
      partnerId: 'them',
      userCommitmentId: 'own',
      partnerCommitmentId: 'target',
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      heartSent: false,
      createdAt: '2026-10-18T00:00:00Z',
    } as ChainConnection;
    connection.supportCards = [completion];
    (service as any)._connections.set([connection]);
    service.supportStale.set(false);
    await expect(service.sendHeart('c', 'missing')).rejects.toThrow('refresh');
    const failed = service.sendHeart('c', 'event');
    const rejected = expect(failed).rejects.toBeTruthy();
    httpMock
      .expectOne(`${environment.apiUrl}/chain/connections/c/heart`)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    await rejected;
    expect(service.connections()[0].heartSent).toBe(false);
    expect(service.pendingHeartTargets().size).toBe(0);
    const retry = service.sendHeart('c', 'event');
    httpMock
      .expectOne(`${environment.apiUrl}/chain/connections/c/heart`)
      .flush({ ...connection, heartSent: true, supportCards: [confirmed] });
    await retry;
    expect(service.connections()[0].heartSent).toBe(true);
  });

  it('uses each own-habit aggregate once rather than adding repeated connection counts', () => {
    vi.spyOn(TestBed.inject(CommitmentService), 'commitments').mockReturnValue([
      {
        id: 'own',
        title: 'Read',
        totalDays: -1,
        currentDay: 1,
        currentStreak: 1,
        isCompletedToday: false,
        category: 'growth',
        startDate: '',
        isPublic: true,
      },
    ]);
    const connection: ChainConnection = {
      id: 'c',
      userId: 'me',
      partnerId: 'them',
      userCommitmentId: 'own',
      partnerCommitmentId: 'target',
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      heartSent: false,
      receivedHeartCount: 2,
      createdAt: '',
    };
    (service as any)._connections.set([
      connection,
      { ...connection, id: 'c2', partnerId: 'other' },
    ]);
    service.supportStale.set(false);
    expect(service.getReceivedHeartCount('own')).toBe(2);
    service.supportStale.set(true);
    expect(service.getReceivedHeartCount('own')).toBe(0);
  });

  it('expires support at the earliest server boundary and deduplicates refresh requests', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.spyOn(authService, 'getToken').mockReturnValue('remote-token');
    const calendar = {
      timeZone: 'Asia/Tehran',
      currentDayKey: '2026-10-18',
      serverNow: '2026-10-18T20:29:58Z',
      nextDayAt: '2026-10-18T20:30:00Z',
    };
    const connection: ChainConnection = {
      id: 'c',
      userId: 'me',
      partnerId: 'them',
      userCommitmentId: 'own',
      partnerCommitmentId: 'target',
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      heartSent: true,
      receivedHeartCount: 2,
      calendar,
      partnerCalendar: calendar,
      createdAt: '2026-10-18T00:00:00Z',
    };
    const request = service.loadConnections();
    expect(service.loadConnections()).toBe(request);
    httpMock
      .expectOne(`${environment.apiUrl}/chain/connections?ngsw-bypass=true`)
      .flush([connection]);
    await request;
    expect(service.supportStale()).toBe(false);
    vi.advanceTimersByTime(2001);
    expect(service.supportStale()).toBe(true);
    expect(service.getReceivedHeartCount('own')).toBe(0);
    const refresh = service.loadConnections();
    httpMock.expectOne(`${environment.apiUrl}/chain/connections?ngsw-bypass=true`).flush([]);
    await refresh;
    expect(service.supportStale()).toBe(false);
  });

  it('does not apply an old read over a confirmed heart or a response from a previous account', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('remote-token');
    const currentUser = vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: 'me',
      username: 'me',
      email: 'me@example.com',
      createdAt: '',
    });
    const connection: ChainConnection = {
      id: 'c',
      userId: 'me',
      partnerId: 'them',
      userCommitmentId: 'own',
      partnerCommitmentId: 'target',
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      heartSent: false,
      createdAt: '2026-10-18T00:00:00Z',
    };
    (service as any)._connections.set([connection]);
    const load = service.loadConnections();
    const read = httpMock.expectOne(`${environment.apiUrl}/chain/connections?ngsw-bypass=true`);
    const nextCompletion = { ...completion, completionId: 'next-event' };
    (service as any)._connections.set([
      { ...connection, supportCards: [completion, nextCompletion] },
    ]);
    service.supportStale.set(false);
    const heart = service.sendHeart('c', 'event');
    httpMock
      .expectOne(`${environment.apiUrl}/chain/connections/c/heart`)
      .flush({ ...connection, heartSent: true, supportCards: [confirmed] });
    await heart;
    read.flush([connection]);
    await load;
    expect(service.connections()[0].heartSent).toBe(true);
    (service as any)._connections.set([{ ...connection, supportCards: [nextCompletion] }]);
    service.supportStale.set(false);
    const oldWrite = service.sendHeart('c', 'next-event');
    const rejected = expect(oldWrite).rejects.toThrow('session changed');
    currentUser.mockReturnValue({
      id: 'new-user',
      username: 'new',
      email: 'new@example.com',
      createdAt: '',
    });
    httpMock
      .expectOne(`${environment.apiUrl}/chain/connections/c/heart`)
      .flush({
        ...connection,
        heartSent: true,
        supportCards: [{ ...confirmed, completionId: 'next-event' }],
      });
    await rejected;
  });

  it('should disconnect connection after confirmation and call API', async () => {
    vi.spyOn(TestBed.inject(CommitmentService), 'commitments').mockReturnValue([
      {
        id: 'comm-1',
        title: 'Read',
        totalDays: -1,
        currentDay: 1,
        currentStreak: 1,
        isCompletedToday: false,
        category: 'growth',
        startDate: new Date().toISOString(),
        isPublic: true,
      },
    ]);
    vi.spyOn(authService, 'getToken').mockReturnValue('jwt_valid_remote_token');
    vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date().toISOString(),
    });

    const mockConnection: ChainConnection = {
      id: 'conn-1',
      userId: 'user-1',
      partnerId: 'user-2',
      userCommitmentId: 'comm-1',
      partnerCommitmentId: 'comm-2',
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      heartSent: false,
      createdAt: new Date().toISOString(),
    };

    (service as any)._connections.set([mockConnection]);

    const request = { generationId: 'generation-1', reason: 'PREFER_NOT_TO_SHARE' as const };
    const disconnectPromise = service.disconnect('conn-1', request);

    expect(service.connections()[0].status).toBe('ACTIVE');
    expect(service.activeConnections().length).toBe(1);

    const req = httpMock.expectOne(`${environment.apiUrl}/chain/connections/conn-1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual(request);
    req.flush({ ...mockConnection, status: 'DISCONNECTED' });

    await disconnectPromise;
    expect(service.activeConnections().length).toBe(0);
    httpMock.expectOne(`${environment.apiUrl}/chain/connections?ngsw-bypass=true`).flush([]);
    await Promise.resolve();
  });

  it('should correctly evaluate unread partner activity and clear on markAsRead', () => {
    vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date().toISOString(),
    });

    const recentDate = new Date().toISOString();
    const mockConnection: ChainConnection = {
      id: 'conn-1',
      userId: 'user-1',
      partnerId: 'user-2',
      userCommitmentId: 'comm-1',
      partnerCommitmentId: 'comm-2',
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      heartSent: false,
      lastPartnerActivityAt: recentDate,
      createdAt: new Date().toISOString(),
    };

    (service as any)._connections.set([mockConnection]);
    service.lastVisitAt.set(null);

    service.checkUnread();
    expect(service.hasUnread()).toBe(true);

    service.markAsRead();
    expect(service.hasUnread()).toBe(false);
    expect(service.lastVisitAt()).toBeTruthy();
  });

  it('loads durable private updates with no active chains and keeps failed dismissals retryable', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('remote-token');
    const receipt = {
      id: 'receipt-1',
      partner: { username: 'sara' },
      recipientHabitTitle: 'Read',
      reason: 'OTHER' as const,
      note: '<b>Keep as text</b>',
      createdAt: '2026-10-19T00:00:00Z',
    };
    const load = service.loadDisconnectReceipts();
    httpMock
      .expectOne(`${environment.apiUrl}/chain/disconnect-receipts?ngsw-bypass=true`)
      .flush([receipt]);
    await load;
    expect(service.disconnectReceipts()).toEqual([receipt]);
    service.markAsRead();
    expect(service.hasUnread()).toBe(true);
    const dismiss = service.dismissDisconnectReceipt(receipt.id);
    expect(service.disconnectReceipts()).toEqual([receipt]);
    httpMock
      .expectOne(`${environment.apiUrl}/chain/disconnect-receipts/receipt-1/dismiss`)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    await dismiss;
    expect(service.disconnectReceipts()).toEqual([receipt]);
    expect(service.receiptError()).toContain('retry');
  });

  it('ignores a private receipt response arriving after the account changes', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('remote-token');
    const currentUser = vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: 'old-user',
      username: 'old',
      email: 'old@example.com',
      createdAt: '',
    });
    const load = service.loadDisconnectReceipts();
    currentUser.mockReturnValue({
      id: 'new-user',
      username: 'new',
      email: 'new@example.com',
      createdAt: '',
    });
    httpMock
      .expectOne(`${environment.apiUrl}/chain/disconnect-receipts?ngsw-bypass=true`)
      .flush([{ id: 'old-account-private-note' }]);
    await load;
    expect(service.disconnectReceipts()).toEqual([]);
  });

  it('should generate full invite URL with production fallback when on localhost/capacitor and include habit details', () => {
    vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: 'user-1',
      email: 'test@example.com',
      username: 'farzad',
      name: 'Farzad',
      createdAt: new Date().toISOString(),
    });

    const mockCommitment = {
      id: 'comm-123',
      title: 'Morning Yoga',
      category: 'health' as const,
      totalDays: 21,
      currentDay: 1,
      currentStreak: 0,
      isCompletedToday: false,
      startDate: new Date().toISOString(),
      isPublic: true,
    };

    const commitmentService = TestBed.inject(CommitmentService);
    vi.spyOn(commitmentService, 'commitments').mockReturnValue([mockCommitment]);

    const url = service.getInviteUrl('comm-123');
    expect(url).toContain('https://mehrchain.pages.dev/chain?');
    expect(url).toContain('invite=comm-123');
    expect(url).not.toContain('inviter=');
    expect(url).not.toContain('habit=');
  });

  it('should parse invite parameters correctly', () => {
    const params = {
      invite: 'comm-123',
      inviter: 'Sara',
      habit: 'Reading Books',
      category: 'growth',
    };

    const parsed = service.parseInviteParams(params);
    expect(parsed).toEqual({
      inviteCode: 'comm-123',
      inviterName: 'Sara',
      habitTitle: 'Reading Books',
      category: 'growth',
      commitmentId: 'comm-123',
    });
  });
});
