import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { CommitmentStore } from '../store/commitment.store';

describe('AuthService (Frontend)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockCommitmentStore: {
    loadForUser: ReturnType<typeof vi.fn>;
    syncWithBackend: ReturnType<typeof vi.fn>;
    resetState: ReturnType<typeof vi.fn>;
    clearUserStorage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    mockCommitmentStore = {
      loadForUser: vi.fn(),
      syncWithBackend: vi.fn().mockResolvedValue(undefined),
      resetState: vi.fn(),
      clearUserStorage: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CommitmentStore, useValue: mockCommitmentStore },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should initialize with no user if storage is empty', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should call register endpoint and return verification status with previewCode', async () => {
    const registerPromise = service.register('Farzad', 'farzad@example.com', 'pass123');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({
      requiresVerification: true,
      email: 'farzad@example.com',
      message: 'Verification code sent to your email address.',
      previewCode: '654321',
    });

    const res = await registerPromise;
    expect(res.requiresVerification).toBe(true);
    expect(res.email).toBe('farzad@example.com');
    expect(res.previewCode).toBe('654321');
  });

  it('should resend verification code and return previewCode', async () => {
    const resendPromise = service.resendVerificationCode('farzad@example.com');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/resend-verification');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'A new verification code has been sent.',
      previewCode: '987654',
    });

    const res = await resendPromise;
    expect(res.success).toBe(true);
    expect(res.previewCode).toBe('987654');
  });

  it('should verify email code and save JWT token to localStorage', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Farzad',
      email: 'farzad@example.com',
      createdAt: new Date().toISOString(),
    };

    const verifyPromise = service.verifyEmail('farzad@example.com', '123456');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/verify-email');
    expect(req.request.method).toBe('POST');
    req.flush({
      user: mockUser,
      accessToken: 'test_token_xyz',
    });

    const user = await verifyPromise;
    expect(user.email).toBe('farzad@example.com');
    expect(service.currentUser()?.email).toBe('farzad@example.com');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe('test_token_xyz');
    expect(mockCommitmentStore.loadForUser).toHaveBeenCalledWith('user-1');
  });

  it('should login user and set authentication state', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Farzad',
      email: 'farzad@example.com',
      createdAt: new Date().toISOString(),
    };

    const loginPromise = service.login('farzad@example.com', 'pass123');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      user: mockUser,
      accessToken: 'login_token_xyz',
    });

    const user = await loginPromise;
    expect(user.id).toBe('user-1');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe('login_token_xyz');
    expect(mockCommitmentStore.loadForUser).toHaveBeenCalledWith('user-1');
  });

  it('should logout and clear local storage and signals', () => {
    localStorage.setItem('mehrchain_auth_user_v1', JSON.stringify({ id: 'u1' }));
    localStorage.setItem('mehrchain_auth_token_v1', 'some_token');

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(mockCommitmentStore.resetState).toHaveBeenCalled();
  });

  it('should throw error when email verification fails with 400 bad request', async () => {
    const verifyPromise = service.verifyEmail('farzad@example.com', '999999');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/verify-email');
    req.flush({ message: 'Invalid or expired verification code' }, { status: 400, statusText: 'Bad Request' });

    await expect(verifyPromise).rejects.toThrow('Invalid or expired verification code');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should throw connection error on login when backend is unreachable (status 0)', async () => {
    const loginPromise = service.login('farzad@example.com', 'pass123');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    await expect(loginPromise).rejects.toThrow('Unable to connect to the server');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should clear USERS_CACHE_KEY on deleteAccount', async () => {
    localStorage.setItem('mehrchain_auth_user_v1', JSON.stringify({ id: 'user-1' }));
    localStorage.setItem('mehrchain_auth_token_v1', 'remote_token_123');
    localStorage.setItem('mehrchain_registered_users_cache_v1', JSON.stringify([{ email: 'farzad@example.com' }]));

    const deletePromise = service.deleteAccount();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/account');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    await deletePromise;

    expect(localStorage.getItem('mehrchain_registered_users_cache_v1')).toBeNull();
    expect(localStorage.getItem('mehrchain_auth_user_v1')).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('should not clear local state and should throw error when backend account deletion fails', async () => {
    localStorage.setItem('mehrchain_auth_user_v1', JSON.stringify({ id: 'user-1' }));
    localStorage.setItem('mehrchain_auth_token_v1', 'remote_token_123');
    localStorage.setItem('mehrchain_registered_users_cache_v1', JSON.stringify([{ email: 'farzad@example.com' }]));

    const deletePromise = service.deleteAccount();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/account');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    await expect(deletePromise).rejects.toThrow('Account deletion failed. Please try again.');

    expect(localStorage.getItem('mehrchain_registered_users_cache_v1')).not.toBeNull();
    expect(localStorage.getItem('mehrchain_auth_user_v1')).not.toBeNull();
    expect(localStorage.getItem('mehrchain_auth_token_v1')).toBe('remote_token_123');
  });

  it('should accurately detect local dev/mock tokens vs remote JWT tokens', () => {
    expect(service.isLocalToken('local_jwt_token_12345')).toBe(true);
    expect(service.isLocalToken('local_dev_token_12345')).toBe(true);
    expect(service.isLocalToken('mock_token')).toBe(true);
    expect(service.isLocalToken(null)).toBe(true);
    expect(service.isLocalToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')).toBe(false);
  });
});
