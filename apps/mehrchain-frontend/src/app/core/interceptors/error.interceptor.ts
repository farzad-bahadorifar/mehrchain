import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let normalizedMessage = 'An unexpected error occurred. Please try again.';

      if (error.status === 0) {
        normalizedMessage =
          req.method === 'GET' || req.method === 'HEAD'
            ? 'Unable to connect to the server. Check your connection, then retry. Your input is kept.'
            : 'Unable to connect to the server. Refresh to check before retrying the change. Your input is kept.';
      } else if ([502, 503, 504, 524].includes(error.status)) {
        normalizedMessage =
          req.method === 'GET' || req.method === 'HEAD'
            ? 'The server is temporarily unavailable. Please wait a moment and retry.'
            : 'Could not confirm the change. Refresh to check before retrying. Your input is kept.';
      } else if ([404, 405].includes(error.status) && /\/auth\/username(?:\?|$)/.test(req.url)) {
        normalizedMessage =
          'Username changes are temporarily unavailable. Your input is kept. Try again later.';
      } else if (error.status === 401) {
        const isAuthEndpoint =
          req.url.includes('/auth/google') ||
          req.url.includes('/auth/login') ||
          req.url.includes('/auth/register') ||
          req.url.includes('/auth/verify-email') ||
          req.url.includes('/auth/resend-verification');

        if (isAuthEndpoint) {
          if (typeof error.error?.message === 'string') {
            normalizedMessage = error.error.message;
          } else if (typeof error.error === 'string') {
            normalizedMessage = error.error;
          } else {
            normalizedMessage = req.url.includes('/auth/google')
              ? 'Google sign-in could not be verified. Please try again.'
              : 'Invalid email or password.';
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

      return throwError(() =>
        Object.assign(new Error(normalizedMessage), {
          status: error.status,
          error: error.error,
        }),
      );
    }),
  );
};
