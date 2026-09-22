import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChainService } from './chain.service';
import { CommitmentService } from './commitment.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { ChainConnection } from '@mehrchain/shared-data';

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
    httpMock.verify();
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

    const req = httpMock.expectOne(`${environment.apiUrl}/chain/connections`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConnections);

    const result = await loadPromise;
    expect(result).toEqual(mockConnections);
    expect(service.connections()).toEqual(mockConnections);
  });

  it('should optimistically toggle heartSent and sync to API', async () => {
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

    const heartPromise = service.sendHeart('conn-1');

    // State updated immediately (optimistic)
    expect(service.connections()[0].heartSent).toBe(true);

    const req = httpMock.expectOne(`${environment.apiUrl}/chain/connections/conn-1/heart`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockConnection, heartSent: true });

    await heartPromise;
  });

  it('should optimistically update lastNudgeSentAt and sync to API', async () => {
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
      status: 'FADING',
      consecutiveMissedDays: 2,
      heartSent: false,
      lastNudgeSentAt: null,
      createdAt: new Date().toISOString(),
    };

    (service as any)._connections.set([mockConnection]);

    const nudgePromise = service.sendNudge('conn-1');

    // State updated immediately
    expect(service.connections()[0].lastNudgeSentAt).toBeTruthy();

    const req = httpMock.expectOne(`${environment.apiUrl}/chain/connections/conn-1/nudge`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockConnection, lastNudgeSentAt: new Date().toISOString() });

    await nudgePromise;
  });

  it('should disconnect connection optimistically and call API', async () => {
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

    const disconnectPromise = service.disconnect('conn-1');

    expect(service.connections()[0].status).toBe('DISCONNECTED');
    expect(service.activeConnections().length).toBe(0);

    const req = httpMock.expectOne(`${environment.apiUrl}/chain/connections/conn-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    await disconnectPromise;
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
});
