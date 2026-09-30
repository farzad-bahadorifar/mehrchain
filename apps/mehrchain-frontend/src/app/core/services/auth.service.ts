import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommitmentStore } from '../store/commitment.store';

export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  email: string;
  role?: string;
  isEmailVerified?: boolean;
  createdAt: string;
}

export interface RegisterResponse {
  requiresVerification: boolean;
  email: string;
  username?: string;
  message: string;
  previewCode?: string;
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
  private readonly USERS_CACHE_KEY = 'mehrchain_registered_users_cache_v1';
  private readonly API_URL = `${environment.apiUrl}/auth`;

  // User authentication state
  private currentUserSignal = signal<UserProfile | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    this.loadPersistedSession();
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Checks if a token is a local dev/offline mock token.
   */
  isLocalToken(token?: string | null): boolean {
    const t = token !== undefined ? token : this.getToken();
    if (!t) return true;
    return t.startsWith('local_') || t.startsWith('mock_');
  }

  private async loadPersistedSession(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.AUTH_KEY);
      const token = this.getToken();

      if (stored && token) {
        const user = JSON.parse(stored) as UserProfile;
        this.currentUserSignal.set(user);
        this.commitmentStore.loadForUser(user.id);

        if (!this.isLocalToken(token)) {
          this.commitmentStore.syncWithBackend().catch(() => {});

          // Verify session silently in background if using remote backend token
          try {
            const freshUser = await firstValueFrom(
              this.http.get<UserProfile>(`${this.API_URL}/me`)
            );
            if (freshUser) {
              this.currentUserSignal.set(freshUser);
              localStorage.setItem(this.AUTH_KEY, JSON.stringify(freshUser));
            }
          } catch (err) {
            console.warn('[AuthService] Silent session refresh skipped or offline:', err);
          }
        }
      }
    } catch (err) {
      console.error('[AuthService] Failed to load stored user session:', err);
    }
  }

  private saveLocalRegisteredUser(user: UserProfile): void {
    try {
      const existing = this.getLocalRegisteredUsers();
      const filtered = existing.filter((u) => u.email !== user.email && u.username !== user.username);
      localStorage.setItem(this.USERS_CACHE_KEY, JSON.stringify([...filtered, user]));
    } catch (e) {
      console.warn('Failed to save to local registered cache', e);
    }
  }

  private getLocalRegisteredUsers(): UserProfile[] {
    try {
      const raw = localStorage.getItem(this.USERS_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  /**
   * Registers a new user account with backend API, or local dev fallback if server is offline.
   */
  async register(username: string, email: string, password?: string, name?: string): Promise<RegisterResponse> {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || username).trim();

    try {
      const payload = {
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail,
        password: password || 'defaultPass123',
      };

      return await firstValueFrom(
        this.http.post<RegisterResponse>(`${this.API_URL}/register`, payload)
      );
    } catch (err: any) {
      // If backend is unreachable or connection refused -> provide seamless local dev fallback
      if (err?.status === 0 || !err?.status) {
        console.warn('[AuthService] Backend unreachable, utilizing local dev registration mode.');
        const mockUser: UserProfile = {
          id: `local_user_${cleanUsername}`,
          username: cleanUsername,
          name: cleanName,
          email: cleanEmail,
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
        };
        this.saveLocalRegisteredUser(mockUser);

        return {
          requiresVerification: true,
          email: cleanEmail,
          username: cleanUsername,
          previewCode: '123456',
          message: 'Verification code sent (use 123456 or any 6 digits in offline mode).',
        };
      }

      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Registration failed. Please check your network connection.';
      throw new Error(message);
    }
  }

  /**
   * Verifies the 6-digit OTP code and saves the active session.
   */
  async verifyEmail(email: string, code: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    try {
      const payload = {
        email: cleanEmail,
        code: cleanCode,
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
      // Offline / Local dev fallback only if registering in offline mode
      if (err?.status === 0 || !err?.status) {
        const localUsers = this.getLocalRegisteredUsers();
        const found = localUsers.find((u) => u.email === cleanEmail);
        if (found) {
          const username = found.username || cleanEmail.split('@')[0];
          const localProfile: UserProfile = {
            id: found.id || `local_user_${username}`,
            username,
            name: found.name || username,
            email: cleanEmail,
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
          };

          localStorage.setItem(this.AUTH_KEY, JSON.stringify(localProfile));
          localStorage.setItem(this.TOKEN_KEY, 'local_dev_token_' + Date.now());

          this.currentUserSignal.set(localProfile);
          this.commitmentStore.loadForUser(localProfile.id);
          return localProfile;
        }
      }

      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Email verification failed. Please check the code and try again.';
      throw new Error(message);
    }
  }

  async resendVerificationCode(email: string): Promise<{ success: boolean; message: string; previewCode?: string }> {
    try {
      const payload = { email: email.trim().toLowerCase() };
      return await firstValueFrom(
        this.http.post<{ success: boolean; message: string; previewCode?: string }>(
          `${this.API_URL}/resend-verification`,
          payload
        )
      );
    } catch (err: any) {
      if (err?.status === 0 || !err?.status) {
        return { success: true, message: 'Verification code simulated in offline mode.', previewCode: '123456' };
      }
      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Failed to resend verification code.';
      throw new Error(message);
    }
  }

  /**
   * Authenticates user credentials with email or username.
   */
  async login(identifier: string, password?: string): Promise<UserProfile> {
    const cleanId = identifier.trim().toLowerCase();

    try {
      const payload = {
        email: cleanId,
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
      if (err?.status === 0 || !err?.status) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }

      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Invalid email/username or password. Please try again.';
      throw new Error(message);
    }
  }

  logout(): void {
    this.commitmentStore.resetState();
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('mehrchain_data_v1');
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }

  async deleteAccount(): Promise<void> {
    const user = this.currentUserSignal();
    const token = this.getToken();

    if (token && !this.isLocalToken(token)) {
      try {
        await firstValueFrom(this.http.delete(`${this.API_URL}/account`));
      } catch (err: any) {
        console.error('[AuthService] Backend account deletion failed:', err);
        throw new Error('Account deletion failed. Please try again.');
      }
    }

    if (user) {
      this.commitmentStore.clearUserStorage(user.id);
    }
    this.commitmentStore.resetState();
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USERS_CACHE_KEY);
    localStorage.removeItem('mehrchain_data_v1');
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }
}
