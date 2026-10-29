import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: { logout: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceSpy = {
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should format status 0 as network error', () => {
    http.get('/api/test').subscribe({
      next: () => expect.fail('Should have failed'),
      error: (err: Error) => {
        expect(err.message).toContain('Check your connection');
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should handle 401 without destroying offline session', () => {
    http.get('/api/protected').subscribe({
      next: () => expect.fail('Should have failed'),
      error: (err: Error) => {
        expect(err.message).toBe('Session expired or unauthorized for remote sync.');
      },
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('should return server error message on 401 if provided', () => {
    http.get('/api/commitments').subscribe({
      next: () => expect.fail('Should have failed'),
      error: (err: Error) => {
        expect(err.message).toBe('Invalid token signature');
      },
    });

    const req = httpMock.expectOne('/api/commitments');
    req.flush({ message: 'Invalid token signature' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should extract array validation messages cleanly', () => {
    http.post('/api/commitments', {}).subscribe({
      next: () => expect.fail('Should have failed'),
      error: (err: Error) => {
        expect(err.message).toBe('title must not be empty. totalDays must be a number');
      },
    });

    const req = httpMock.expectOne('/api/commitments');
    req.flush(
      { message: ['title must not be empty', 'totalDays must be a number'] },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it.each([404, 405])('does not expose framework route errors for username save (%s)', (status) => {
    let message = '';
    let receivedStatus = 0;
    http.patch('/api/auth/username', { username: 'owner' }).subscribe({
      error: (error) => {
        message = error.message;
        receivedStatus = error.status;
      },
    });
    httpMock
      .expectOne('/api/auth/username')
      .flush({ message: 'Cannot PATCH /api/auth/username' }, { status, statusText: 'Unavailable' });
    expect(message).toContain('temporarily unavailable');
    expect(message).toContain('Your input is kept');
    expect(message).not.toContain('Cannot PATCH');
    expect(receivedStatus).toBe(status);
  });
});
