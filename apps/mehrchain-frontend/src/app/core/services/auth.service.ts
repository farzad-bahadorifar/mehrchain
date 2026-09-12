import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommitmentStore } from '../store/commitment.store';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  isEmailVerified?: boolean;
  createdAt: string;
}

export interface RegisterResponse {
  requiresVerification: boolean;
  email: string;
  message: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private commitmentStore = inject(CommitmentStore);

  private readonly AUTH_KEY = 'mehrchain_auth_user_v1';
  private readonly TOKEN_KEY = 'mehrchain_auth_token_v1';
  private readonly API_URL = `${environment.apiUrl}/auth`;

  // User authentication state
  private currentUserSignal = signal<UserProfile | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    this.loadPersistedSession();
  }

  /**
   * Retrieves the current stored JWT access token.
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Loads persisted user session on application launch for instant auto-login.
   */
  private async loadPersistedSession(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.AUTH_KEY);
      const token = this.getToken();

      if (stored && token) {
        const user = JSON.parse(stored) as UserProfile;
        this.currentUserSignal.set(user);
        this.commitmentStore.loadForUser(user.id);
        this.commitmentStore.syncWithBackend().catch(() => {});

        // Verify session validity silently in background
        try {
          const freshUser = await firstValueFrom(
            this.http.get<UserProfile>(`${this.API_URL}/me`)
          );
          if (freshUser) {
            this.currentUserSignal.set(freshUser);
            localStorage.setItem(this.AUTH_KEY, JSON.stringify(freshUser));
          }
        } catch (err) {
          // If token expired on server (401), clean up
          if (err instanceof HttpErrorResponse && err.status === 401) {
            this.logout();
          }
        }
      }
    } catch (err) {
      console.error('[AuthService] Failed to load stored user session:', err);
    }
  }

  /**
   * Registers a new user account with the backend API and initiates email verification.
   *
   * @param name - Display name of the user.
   * @param email - Primary user email address.
   * @param password - Account password.
   * @returns Resolves with the register response indicating verification code dispatch.
   * @throws {Error} If registration fails due to duplicate email or validation errors.
   */
  async register(name: string, email: string, password?: string): Promise<RegisterResponse> {
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password || 'defaultPass123',
      };

      return await firstValueFrom(
        this.http.post<RegisterResponse>(`${this.API_URL}/register`, payload)
      );
    } catch (err: any) {
      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Registration failed. Please check your network connection.';
      throw new Error(message);
    }
  }

  /**
   * Verifies the 6-digit OTP code sent to user email and saves the active session.
   *
   * @param email - Primary user email address.
   * @param code - 6-digit verification code.
   * @returns Resolves with the authenticated UserProfile.
   * @throws {Error} If code is invalid or expired.
   */
  async verifyEmail(email: string, code: string): Promise<UserProfile> {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        code: code.trim(),
      };

      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/verify-email`, payload)
      );

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(res.user));
      localStorage.setItem(this.TOKEN_KEY, res.accessToken);

      this.currentUserSignal.set(res.user);
      this.commitmentStore.loadForUser(res.user.id);
      this.commitmentStore.syncWithBackend().catch(() => {});
      return res.user;
    } catch (err: any) {
      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Email verification failed. Please try again.';
      throw new Error(message);
    }
  }

  /**
   * Resends a new 6-digit verification code to the user's email.
   *
   * @param email - Primary user email address.
   */
  async resendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = { email: email.trim().toLowerCase() };
      return await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(
          `${this.API_URL}/resend-verification`,
          payload
        )
      );
    } catch (err: any) {
      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Failed to resend verification code.';
      throw new Error(message);
    }
  }

  /**
   * Authenticates an existing user account with the backend API.
   *
   * @param email - User account email.
   * @param password - Account password.
   * @returns Resolves with the authenticated UserProfile.
   * @throws {Error} If credentials are invalid or user does not exist.
   */
  async login(email: string, password?: string): Promise<UserProfile> {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password: password || '',
      };

      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/login`, payload)
      );

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(res.user));
      localStorage.setItem(this.TOKEN_KEY, res.accessToken);

      this.currentUserSignal.set(res.user);
      this.commitmentStore.loadForUser(res.user.id);
      this.commitmentStore.syncWithBackend().catch(() => {});
      return res.user;
    } catch (err: any) {
      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Invalid email or password. Please try again.';
      throw new Error(message);
    }
  }

  /**
   * Signs the user out of the application and clears tokens.
   */
  logout(): void {
    this.commitmentStore.resetState();
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('mehrchain_data_v1');
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }

  /**
   * Permanently deletes user profile and session from both server database and local storage.
   */
  async deleteAccount(): Promise<void> {
    const user = this.currentUserSignal();
    try {
      const token = this.getToken();
      if (token) {
        await firstValueFrom(this.http.delete(`${this.API_URL}/account`));
      }
    } catch (err) {
      console.warn('[AuthService] Backend account deletion warning:', err);
    } finally {
      if (user) {
        this.commitmentStore.clearUserStorage(user.id);
      }
      this.commitmentStore.resetState();
      localStorage.removeItem(this.AUTH_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('mehrchain_data_v1');
      this.currentUserSignal.set(null);
      this.router.navigate(['/']);
    }
  }
}
