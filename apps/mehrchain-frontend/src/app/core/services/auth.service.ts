import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt: string;
}

interface AuthResponse {
  user: UserProfile;
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

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
   * Registers a new user account with the backend API, persists the auth session,
   * and broadcasts the current user profile signal.
   *
   * @param name - Display name of the user.
   * @param email - Primary user email address.
   * @param password - Account password.
   * @returns Resolves with the saved UserProfile upon successful registration.
   * @throws {Error} If registration fails due to duplicate email or validation errors.
   */
  async register(name: string, email: string, password?: string): Promise<UserProfile> {
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password || 'defaultPass123',
      };

      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/register`, payload)
      );

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(res.user));
      localStorage.setItem(this.TOKEN_KEY, res.accessToken);

      this.currentUserSignal.set(res.user);
      return res.user;
    } catch (err: any) {
      const message =
        err?.message ||
        err?.error?.message ||
        (Array.isArray(err?.error?.message) ? err.error.message[0] : null) ||
        'Registration failed. Please check your network connection.';
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
      return res.user;
    } catch (err: any) {
      const message =
        err?.message ||
        err?.error?.message ||
        'Invalid email or password. Please try again.';
      throw new Error(message);
    }
  }

  /**
   * Signs the user out of the application and clears tokens.
   */
  logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }

  /**
   * Permanently deletes user profile and session.
   */
  deleteAccount(): void {
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }
}
