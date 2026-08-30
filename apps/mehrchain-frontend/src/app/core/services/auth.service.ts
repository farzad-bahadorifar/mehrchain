import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommitmentService } from './commitment.service';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private commitmentService = inject(CommitmentService);

  private readonly AUTH_KEY = 'mehrchain_auth_user_v1';
  private readonly TOKEN_KEY = 'mehrchain_auth_token_v1';

  // User authentication state
  private currentUserSignal = signal<UserProfile | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    this.loadPersistedSession();
  }

  /**
   * Loads persisted user session on application launch for automatic login.
   */
  private loadPersistedSession(): void {
    try {
      const stored = localStorage.getItem(this.AUTH_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        this.currentUserSignal.set(user);
      }
    } catch (err) {
      console.error('[AuthService] Failed to load stored user session:', err);
    }
  }

  /**
   * Registers a new user and creates their profile session.
   */
  async register(name: string, email: string, password?: string): Promise<UserProfile> {
    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    // Store profile and mock JWT token
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(newUser));
    localStorage.setItem(this.TOKEN_KEY, 'mock_token_' + Date.now());

    this.currentUserSignal.set(newUser);
    return newUser;
  }

  /**
   * Logs in an existing user.
   */
  async login(email: string, password?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if there was a previous registered user with this email
    let user: UserProfile;
    const stored = localStorage.getItem(this.AUTH_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserProfile;
      if (parsed.email === cleanEmail) {
        user = parsed;
      } else {
        user = {
          id: crypto.randomUUID(),
          name: cleanEmail.split('@')[0] || 'Explorer',
          email: cleanEmail,
          createdAt: new Date().toISOString(),
        };
      }
    } else {
      user = {
        id: crypto.randomUUID(),
        name: cleanEmail.split('@')[0] || 'Explorer',
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      };
    }

    localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, 'mock_token_' + Date.now());

    this.currentUserSignal.set(user);
    return user;
  }

  /**
   * Signs the user out of the application.
   */
  logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }

  /**
   * Permanently deletes user profile and associated habit data.
   */
  deleteAccount(): void {
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.commitmentService.resetData();
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }
}
