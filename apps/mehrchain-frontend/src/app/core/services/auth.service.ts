import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
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
  isOfflineMode?: boolean;
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

  readonly ready: Promise<void>;
  readonly sessionError = signal<string | null>(null);
  constructor() {
    this.ready = this.loadPersistedSession();
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

  /**
   * Helper to determine if an error was caused by a network connection / server reachability failure.
   */
  isNetworkError(err: any): boolean {
    if (!err) return false;
    if (err.status === 0) return true;
    const msg = (err.message || '').toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('unable to connect') ||
      msg.includes('connect to the server') ||
      msg.includes('failed to fetch') ||
      msg.includes('timeout')
    );
  }

  private async loadPersistedSession(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.AUTH_KEY);
      const token = this.getToken();
      if (!stored || !token) return;
      const cached = JSON.parse(stored) as UserProfile;
      if (this.isLocalToken(token)) {
        if (environment.production) {
          this.logout();
          return;
        }
        this.currentUserSignal.set(cached);
        this.commitmentStore.loadForUser(cached.id);
        return;
      }
      // Let dependency injection finish before the auth interceptor requests this service.
      await Promise.resolve();
      try {
        const user = await firstValueFrom(
          this.http.get<UserProfile>(`${this.API_URL}/me`).pipe(timeout(60000)),
        );
        if (this.getToken() !== token) return;
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
        this.currentUserSignal.set(user);
        this.commitmentStore.loadForUser(user.id);
        await this.commitmentStore.syncWithBackend();
      } catch (err: any) {
        if (this.getToken() !== token) return;
        if (err.status === 401 || err.status === 403) this.logout();
        else this.sessionError.set('Could not verify your session. Please retry sign-in.');
      }
    } catch {
      this.logout();
    }
  }

  private requireDemoEnvironment(): void {
    if (environment.production) throw new Error('Demo accounts are unavailable in production.');
  }

  navigateAfterLogin(): void {
    const target = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
    if (typeof target === 'string' && target.startsWith('/chain?'))
      this.router.navigateByUrl(target);
    else this.router.navigate(['/dashboard']);
  }

  private saveLocalRegisteredUser(user: UserProfile): void {
    try {
      const existing = this.getLocalRegisteredUsers();
      const filtered = existing.filter(
        (u) => u.email !== user.email && u.username !== user.username,
      );
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
   * Registers a new user account with backend API.
   * Throws network connection error if server cannot be reached so the UI can prompt for retry or demo mode.
   */
  async register(
    username: string,
    email: string,
    password?: string,
    name?: string,
  ): Promise<RegisterResponse> {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || username).trim();

    try {
      const payload = {
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail,
        password: password || '',
      };

      return await firstValueFrom(
        this.http.post<RegisterResponse>(`${this.API_URL}/register`, payload),
      );
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        throw new Error(
          'Unable to connect to the server. Please check your network connection or VPN.',
        );
      }

      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Registration failed. Please check your details.';
      throw new Error(message);
    }
  }

  /**
   * Explicitly registers a mock profile in offline / demo mode.
   */
  registerOffline(username: string, email: string, name?: string): RegisterResponse {
    this.requireDemoEnvironment();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || username).trim();

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
      message: 'Demo Mode: Verification code 123456 auto-filled.',
      isOfflineMode: true,
    };
  }

  /**
   * Verifies the 6-digit OTP code and saves the active session.
   */
  async verifyEmail(email: string, code: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Check if this was a locally registered demo user
    const localUsers = this.getLocalRegisteredUsers();
    const foundLocal = localUsers.find((u) => u.email === cleanEmail);

    try {
      const payload = {
        email: cleanEmail,
        code: cleanCode,
      };

      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/verify-email`, payload),
      );

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(res.user));
      localStorage.setItem(this.TOKEN_KEY, res.accessToken);

      this.currentUserSignal.set(res.user);
      this.commitmentStore.loadForUser(res.user.id);
      await this.commitmentStore.syncWithBackend();
      return res.user;
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        if (foundLocal) {
          return this.verifyEmailOffline(cleanEmail, cleanCode);
        }
        throw new Error(
          'Unable to connect to the server. Please check your network connection or VPN.',
        );
      }

      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Email verification failed. Please check the code and try again.';
      throw new Error(message);
    }
  }

  /**
   * Explicitly verifies offline / demo mode session.
   */
  verifyEmailOffline(email: string, _code?: string): UserProfile {
    this.requireDemoEnvironment();
    const cleanEmail = email.trim().toLowerCase();
    const localUsers = this.getLocalRegisteredUsers();
    const found = localUsers.find((u) => u.email === cleanEmail);
    const username = found?.username || cleanEmail.split('@')[0];

    const localProfile: UserProfile = {
      id: found?.id || `local_user_${username}`,
      username,
      name: found?.name || username,
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

  async resendVerificationCode(
    email: string,
  ): Promise<{ success: boolean; message: string; previewCode?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const payload = { email: cleanEmail };
      return await firstValueFrom(
        this.http.post<{ success: boolean; message: string; previewCode?: string }>(
          `${this.API_URL}/resend-verification`,
          payload,
        ),
      );
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        const localUsers = this.getLocalRegisteredUsers();
        if (localUsers.find((u) => u.email === cleanEmail)) {
          return {
            success: true,
            message: 'Demo Mode: Verification code 123456 auto-filled.',
            previewCode: '123456',
          };
        }
        throw new Error(
          'Unable to connect to the server. Please check your network connection or VPN.',
        );
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
   * Authenticates with Google ID token.
   */
  async googleLogin(idToken: string): Promise<UserProfile> {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/google`, { idToken }),
      );

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(res.user));
      localStorage.setItem(this.TOKEN_KEY, res.accessToken);

      this.currentUserSignal.set(res.user);
      this.commitmentStore.loadForUser(res.user.id);
      await this.commitmentStore.syncWithBackend();
      return res.user;
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        throw new Error(
          'Unable to connect to the server. Please check your network connection or VPN.',
        );
      }

      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Google sign-in failed. Please try again.';
      throw new Error(message);
    }
  }

  /**
   * Mock Google sign-in for offline testing.
   */
  googleLoginOffline(email = 'tester@gmail.com', name = 'Google Tester'): UserProfile {
    this.requireDemoEnvironment();
    const cleanEmail = email.trim().toLowerCase();
    const username = cleanEmail.split('@')[0];

    const localProfile: UserProfile = {
      id: `local_google_${username}`,
      username,
      name,
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
        this.http.post<AuthResponse>(`${this.API_URL}/login`, payload),
      );

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(res.user));
      localStorage.setItem(this.TOKEN_KEY, res.accessToken);

      this.currentUserSignal.set(res.user);
      this.commitmentStore.loadForUser(res.user.id);
      await this.commitmentStore.syncWithBackend();
      return res.user;
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        throw new Error(
          'Unable to connect to the server. Please check your network connection or VPN.',
        );
      }

      const message =
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        err?.message ||
        'Invalid email/username or password. Please try again.';
      throw new Error(message);
    }
  }

  /**
   * Explicitly signs into demo / offline mode account.
   */
  loginOffline(identifier: string): UserProfile {
    this.requireDemoEnvironment();
    const cleanId = identifier.trim().toLowerCase();
    const localUsers = this.getLocalRegisteredUsers();
    const found = localUsers.find((u) => u.email === cleanId || u.username === cleanId);
    const username = found?.username || cleanId.replace(/@.*$/, '').replace(/^@/, '');

    const localProfile: UserProfile = {
      id: found?.id || `local_user_${username}`,
      username,
      name: found?.name || username,
      email: found?.email || `${username}@example.com`,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(this.AUTH_KEY, JSON.stringify(localProfile));
    localStorage.setItem(this.TOKEN_KEY, 'local_dev_token_' + Date.now());

    this.currentUserSignal.set(localProfile);
    this.commitmentStore.loadForUser(localProfile.id);
    return localProfile;
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

    if (environment.production && (!user || this.isLocalToken(token)))
      throw new Error('Please sign in before deleting your account.');
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
      for (const key of [
        `mehrchain_chain_connections_${user.id}`,
        `mehrchain_chain_last_visit_${user.id}`,
        `mehrchain_mero_customization_v1_${user.id}`,
      ])
        localStorage.removeItem(key);
      localStorage.setItem(
        this.USERS_CACHE_KEY,
        JSON.stringify(this.getLocalRegisteredUsers().filter((u) => u.id !== user.id)),
      );
      localStorage.removeItem('mehrchain_mero_customization_v1');
    }
    this.commitmentStore.resetState();
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    // Other users' caches remain isolated.
    localStorage.removeItem('mehrchain_data_v1');
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }
}
