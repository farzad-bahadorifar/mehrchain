import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'mehrchain_theme_mode_v1';

  // Selected mode: 'light', 'dark', or 'system'
  readonly mode = signal<ThemeMode>('system');

  // Computed boolean indicating if dark mode is actively applied
  readonly isDark = signal<boolean>(false);

  private mediaQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  constructor() {
    this.initializeTheme();

    // Effect to apply theme whenever mode changes
    effect(() => {
      const currentMode = this.mode();
      this.applyTheme(currentMode);
    });

    // Listen for OS theme changes when in 'system' mode
    if (this.mediaQuery && typeof this.mediaQuery.addEventListener === 'function') {
      this.mediaQuery.addEventListener('change', (e) => {
        if (this.mode() === 'system') {
          this.updateDocumentClass(e.matches);
        }
      });
    }
  }

  private initializeTheme(): void {
    try {
      const stored = localStorage.getItem(this.THEME_KEY) as ThemeMode | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        this.mode.set(stored);
      } else {
        this.mode.set('system');
      }
    } catch {
      this.mode.set('system');
    }
  }

  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      localStorage.setItem(this.THEME_KEY, mode);
    } catch (err) {
      console.warn('[ThemeService] Failed to save theme preference:', err);
    }
  }

  private applyTheme(mode: ThemeMode): void {
    let shouldBeDark = false;

    if (mode === 'dark') {
      shouldBeDark = true;
    } else if (mode === 'light') {
      shouldBeDark = false;
    } else if (mode === 'system') {
      shouldBeDark = this.mediaQuery ? this.mediaQuery.matches : false;
    }

    this.updateDocumentClass(shouldBeDark);
  }

  private updateDocumentClass(isDark: boolean): void {
    this.isDark.set(isDark);

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Update mobile status bar theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#0b1120' : '#ffffff');
      }
    }
  }
}
