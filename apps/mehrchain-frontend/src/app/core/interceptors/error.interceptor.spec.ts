import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
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
        expect(err.message).toContain('check your internet connection');
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should handle 401 and trigger logout', () => {
    http.get('/api/protected').subscribe({
      next: () => expect.fail('Should have failed'),
      error: (err: Error) => {
        expect(err.message).toContain('Session expired');
        expect(authServiceSpy.logout).toHaveBeenCalled();
      },
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
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
      { status: 400, statusText: 'Bad Request' }
    );
  });
});
