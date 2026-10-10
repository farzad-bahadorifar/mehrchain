import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService, UserProfile } from './auth.service';
import { ThemeService } from './theme.service';

interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }): void;
  renderButton(
    element: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      width?: number | string;
      logo_alignment?: 'left' | 'center';
    }
  ): void;
}

function identity(): GoogleIdentity | undefined {
  return (globalThis as typeof globalThis & { google?: { accounts?: { id?: GoogleIdentity } } })
    .google?.accounts?.id;
}

const STYLE_ID = 'mehrchain-google-modal-style';

function ensureModalStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    dialog.mehrchain-google-dialog {
      position: fixed !important;
      inset: 0 !important;
      margin: auto !important;
      padding: 16px !important;
      border: none !important;
      background: transparent !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      z-index: 99999 !important;
      outline: none !important;
    }
    dialog.mehrchain-google-dialog::backdrop {
      background: rgba(0, 0, 0, 0.65) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      animation: mcFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes mcFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes mcScaleUp {
      from {
        opacity: 0;
        transform: scale(0.92) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    .mc-google-card {
      animation: mcScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .mc-close-btn:hover {
      transform: scale(1.08);
    }
    .mc-cancel-btn:active {
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(style);
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
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
    ensureModalStyles();

    const isDark =
      this.themeService.isDark() ||
      document.documentElement.classList.contains('dark') ||
      (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

    return new Promise<UserProfile>((resolve, reject) => {
      const dialog = document.createElement('dialog');
      dialog.className = 'mehrchain-google-dialog';
      dialog.setAttribute('aria-label', 'Google sign-in');

      const card = document.createElement('div');
      card.className = 'mc-google-card';
      card.style.cssText = `
        position: relative;
        width: 100%;
        max-width: 340px;
        border-radius: 28px;
        padding: 26px 20px 20px;
        box-sizing: border-box;
        text-align: center;
        font-family: 'Poppins', system-ui, -apple-system, sans-serif;
        background: ${isDark ? 'hsl(222, 47%, 14%)' : '#ffffff'};
        color: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(220, 29%, 17%)'};
        border: 1px solid ${isDark ? 'hsl(217, 33%, 24%)' : 'hsl(210, 20%, 90%)'};
        box-shadow: ${
          isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)'
        };
      `;

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.className = 'mc-close-btn';
      closeBtn.style.cssText = `
        position: absolute;
        top: 14px;
        right: 14px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: none;
        background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
        color: ${isDark ? '#94a3b8' : '#64748b'};
        transition: all 0.15s ease;
        outline: none;
      `;
      closeBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      `;

      const iconContainer = document.createElement('div');
      iconContainer.style.cssText = `
        width: 48px;
        height: 48px;
        border-radius: 16px;
        margin: 2px auto 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc'};
        border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'};
      `;
      iconContainer.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      `;

      const title = document.createElement('h3');
      title.textContent = 'Continue with Google';
      title.style.cssText = `
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 6px;
        letter-spacing: -0.01em;
        color: ${isDark ? '#f8fafc' : '#0f172a'};
      `;

      const subtitle = document.createElement('p');
      subtitle.textContent = 'Choose an account to continue to MehrChain';
      subtitle.style.cssText = `
        font-size: 12px;
        margin: 0 0 20px;
        color: ${isDark ? '#94a3b8' : '#64748b'};
        line-height: 1.45;
      `;

      const buttonWrapper = document.createElement('div');
      buttonWrapper.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        min-height: 44px;
        margin-bottom: 14px;
      `;

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'mc-cancel-btn';
      cancelBtn.style.cssText = `
        width: 100%;
        padding: 11px 16px;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        font-family: inherit;
        transition: all 0.15s ease;
        background: ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'};
        color: ${isDark ? '#cbd5e1' : '#475569'};
        border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'};
      `;

      card.append(closeBtn, iconContainer, title, subtitle, buttonWrapper, cancelBtn);
      dialog.appendChild(card);

      let submitted = false;
      const close = () => {
        if (dialog.parentNode) {
          dialog.remove();
        }
      };
      const abort = () => {
        if (!submitted) {
          close();
          reject(new Error('Google sign-in cancelled.'));
        }
      };

      closeBtn.onclick = abort;
      cancelBtn.onclick = abort;
      dialog.onclick = (event) => {
        if (event.target === dialog) {
          abort();
        }
      };
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
            cancelBtn.disabled = true;
            closeBtn.disabled = true;
            this.authService.googleLogin(response.credential).then(resolve, reject).finally(close);
          },
        });
        identity()!.renderButton(buttonWrapper, {
          type: 'standard',
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 280,
        });
        dialog.showModal();
      } catch {
        close();
        reject(new Error('Could not open Google sign-in. Please retry.'));
      }
    });
  }
}
