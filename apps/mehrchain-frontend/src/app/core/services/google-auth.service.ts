import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService, UserProfile } from './auth.service';

interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }): void;
  renderButton(element: HTMLElement, options: { type: string; theme: string; size: string }): void;
}
function identity(): GoogleIdentity | undefined {
  return (globalThis as typeof globalThis & { google?: { accounts?: { id?: GoogleIdentity } } })
    .google?.accounts?.id;
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly authService = inject(AuthService);
  private loading: Promise<void> | null = null;
  private active: Promise<UserProfile> | null = null;

  loadGoogleScript(): Promise<void> {
    if (identity()) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error('Google sign-in timed out. Please retry.'));
      }, 10000);
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        identity() ? resolve() : reject(new Error('Google sign-in is unavailable.'));
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error('Could not load Google sign-in. Check your connection.'));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      this.loading = null;
      throw error;
    });
    return this.loading;
  }

  signInWithGoogle(): Promise<UserProfile> {
    if (this.active) return this.active;
    this.active = this.openSignIn().finally(() => {
      this.active = null;
    });
    return this.active;
  }

  private async openSignIn(): Promise<UserProfile> {
    if (!environment.googleClientId || environment.googleClientId.includes('-mock.')) {
      throw new Error('Google sign-in is not configured yet. Please use email sign-in.');
    }
    await this.loadGoogleScript();
    // An official button remains available even when One Tap is suppressed by the browser.
    return new Promise<UserProfile>((resolve, reject) => {
      const dialog = document.createElement('dialog');
      dialog.setAttribute('aria-label', 'Google sign-in');
      dialog.style.cssText = 'padding:24px;border-radius:16px;border:0;max-width:90vw';
      const title = document.createElement('p');
      title.textContent = 'Continue with your Google account';
      const button = document.createElement('div');
      const cancel = document.createElement('button');
      cancel.textContent = 'Cancel';
      cancel.style.cssText = 'display:block;margin-top:16px;padding:8px 16px';
      dialog.append(title, button, cancel);
      let submitted = false;
      const close = () => dialog.remove();
      const abort = () => {
        if (!submitted) {
          close();
          reject(new Error('Google sign-in cancelled.'));
        }
      };
      cancel.onclick = abort;
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        abort();
      });
      document.body.appendChild(dialog);
      try {
        identity()!.initialize({
          client_id: environment.googleClientId,
          callback: (response) => {
            if (submitted) return;
            if (!response.credential) {
              close();
              reject(new Error('Google returned no credential.'));
              return;
            }
            submitted = true;
            cancel.disabled = true;
            this.authService.googleLogin(response.credential).then(resolve, reject).finally(close);
          },
        });
        identity()!.renderButton(button, { type: 'standard', theme: 'outline', size: 'large' });
        dialog.showModal();
      } catch {
        close();
        reject(new Error('Could not open Google sign-in. Please retry.'));
      }
    });
  }
}
