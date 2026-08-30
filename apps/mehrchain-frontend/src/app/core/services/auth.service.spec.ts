import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService (Frontend)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
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

  it('should register user and save JWT token to localStorage', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'Farzad',
      email: 'farzad@example.com',
      createdAt: new Date().toISOString(),
    };

    const registerPromise = service.register('Farzad', 'farzad@example.com', 'pass123');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({
      user: mockUser,
      accessToken: 'test_token_xyz',
    });

    const user = await registerPromise;
    expect(user.email).toBe('farzad@example.com');
    expect(service.currentUser()?.email).toBe('farzad@example.com');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe('test_token_xyz');
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
  });

  it('should logout and clear local storage and signals', () => {
    localStorage.setItem('mehrchain_auth_user_v1', JSON.stringify({ id: 'u1' }));
    localStorage.setItem('mehrchain_auth_token_v1', 'some_token');

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });
});
