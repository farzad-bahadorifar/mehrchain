import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Global HTTP Error Interceptor.
 * Normalizes API error responses into clean, user-friendly messages.
 * Automatically handles 401 Unauthorized by clearing session and redirecting.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let normalizedMessage = 'An unexpected error occurred. Please try again.';

      if (error.status === 0) {
        normalizedMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.status === 401) {
        // Token expired or invalid
        normalizedMessage = 'Session expired. Please sign in again.';
        authService.logout();
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
