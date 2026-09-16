import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let normalizedMessage = 'An unexpected error occurred. Please try again.';

      if (error.status === 0) {
        normalizedMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.status === 401) {
        const isAuthEndpoint = req.url.includes('/auth/login') ||
          req.url.includes('/auth/register') ||
          req.url.includes('/auth/verify-email') ||
          req.url.includes('/auth/resend-verification');

        if (isAuthEndpoint) {
          if (typeof error.error?.message === 'string') {
            normalizedMessage = error.error.message;
          } else if (typeof error.error === 'string') {
            normalizedMessage = error.error;
          } else {
            normalizedMessage = 'Invalid email or password.';
          }
        } else {
          // Token expired, unauthorized or invalid during remote operation
          if (typeof error.error?.message === 'string') {
            normalizedMessage = error.error.message;
          } else if (typeof error.error === 'string') {
            normalizedMessage = error.error;
          } else {
            normalizedMessage = 'Session expired or unauthorized for remote sync.';
          }
        }
      } else if (error.error) {
        if (typeof error.error === 'string') {
          normalizedMessage = error.error;
        } else if (typeof error.error.message === 'string') {
          normalizedMessage = error.error.message;
        } else if (Array.isArray(error.error.message)) {
          // ValidationPipe errors: ['title must not be empty', 'totalDays must be a number']
          normalizedMessage = error.error.message.join('. ');
        } else if (error.message) {
          normalizedMessage = error.message;
        }
      }

      console.warn(`[HTTP Error ${error.status}] ${req.method} ${req.url}:`, normalizedMessage);

      return throwError(() => new Error(normalizedMessage));
    })
  );
};
