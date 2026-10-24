import {
  ApplicationRef,
  DestroyRef,
  Injectable,
  InjectionToken,
  NgZone,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';
import { filter, firstValueFrom, from, take, timeout } from 'rxjs';
import { APP_VERSION } from '../../../environments/app-version';
import { AndroidRelease, eligibleAndroidRelease } from '../utils/release-version';
import { INSTALLED_RELEASE } from '../utils/native-release';

export const UPDATE_PLATFORM = new InjectionToken<string>('UPDATE_PLATFORM', {
  providedIn: 'root',
  factory: () => Capacitor.getPlatform(),
});
export const UPDATE_ACTIONS = new InjectionToken('UPDATE_ACTIONS', {
  providedIn: 'root',
  factory: () => ({
    reload: () => window.location.reload(),
    // Capacitor's URL interceptor opens external hosts through Android ACTION_VIEW
    // and keeps the application WebView/session intact.
    download: (url: string) => window.location.assign(url),
    confirm: (message: string) => window.confirm(message),
  }),
});
export interface AvailableUpdate {
  kind: 'android' | 'web';
  id: string;
  version: string;
  release?: AndroidRelease;
}

export interface ReleaseNote {
  version: string;
  title: string;
  date: string;
  isLatest: boolean;
  highlights: string[];
}

export const CURRENT_APP_VERSION = APP_VERSION.version;
const STORAGE_KEY_SEEN_VERSION = 'mehrchain_last_seen_version';

export const APP_CHANGELOG: ReleaseNote[] = [
  {
    version: CURRENT_APP_VERSION,
    title: 'Release preview',
    date: 'Oct 2026',
    isLatest: true,
    highlights: [
      'Optional Android release downloads and web update notices',
      'Mobile touch improvements and responsive app layout',
      'Daily habits, private support and permanent earned colors',
    ],
  },
  {
    version: '0.9.1',
    title: 'Chain Beta & Offline Engine',
    date: 'Sep 2026',
    isLatest: false,
    highlights: [
      'Mutual support connections with heart reactions & gentle nudges',
      'Offline-first synchronization with instant local updates',
      'Dynamic safe-area navigation & mobile UI polish',
    ],
  },
  {
    version: '0.9.0',
    title: 'Preview MVP',
    date: 'Sep 2026',
    isLatest: false,
    highlights: [
      'Daily habit tracking & consistency heatmap',
      'Mero companion mascot & adaptive dark/light themes',
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  private swUpdate = inject(SwUpdate, { optional: true });
  private destroyRef = inject(DestroyRef);
  private platform = inject(UPDATE_PLATFORM);
  private actions = inject(UPDATE_ACTIONS);
  private installedRelease = inject(INSTALLED_RELEASE);
  // Deliberately bypass account/auth/retry interceptors for public update metadata.
  private backend = inject(HttpBackend, { optional: true });
  private http = this.backend ? new HttpClient(this.backend) : null;
  private lastCheck = 0;
  private dismissed = signal(this.readDismissal());
  private now = signal(Date.now());

  readonly currentVersion = CURRENT_APP_VERSION;
  private unseenNotes = signal(this.checkIfNewVersion());
  readonly changelog = APP_CHANGELOG;
  readonly availableUpdate = signal<AvailableUpdate | null>(null);
  readonly checking = signal(false);
  readonly checkError = signal<string | null>(null);
  readonly checked = signal(false);
  readonly hasNewVersion = computed(() => this.unseenNotes() || Boolean(this.availableUpdate()));
  readonly showUpdateNotice = computed(() => {
    const update = this.availableUpdate();
    const dismissal = this.dismissed();
    return Boolean(update && (dismissal?.id !== update.id || dismissal.until <= this.now()));
  });

  constructor() {
    this.initSwUpdateListener();
    const zone = inject(NgZone);
    inject(ApplicationRef)
      .isStable.pipe(filter(Boolean), take(1), takeUntilDestroyed())
      .subscribe(() =>
        zone.runOutsideAngular(() => {
          void this.checkForUpdates();
          const interval = setInterval(
            () => {
              if (document.visibilityState === 'visible') void this.checkForUpdates();
            },
            60 * 60 * 1000,
          );
          const resume = () => {
            if (document.visibilityState === 'visible') void this.checkForUpdates();
          };
          document.addEventListener('visibilitychange', resume);
          window.addEventListener('online', resume);
          this.destroyRef.onDestroy(() => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', resume);
            window.removeEventListener('online', resume);
          });
        }),
      );
  }

  private checkIfNewVersion(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const seenVersion = localStorage.getItem(STORAGE_KEY_SEEN_VERSION);
      return seenVersion !== this.currentVersion;
    } catch {
      return false;
    }
  }

  private initSwUpdateListener(): void {
    if (this.platform === 'web' && this.swUpdate?.isEnabled) {
      this.swUpdate.versionUpdates.pipe(takeUntilDestroyed()).subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          const data = event.latestVersion.appData as { version?: string } | undefined;
          this.availableUpdate.set({
            kind: 'web',
            id: event.latestVersion.hash,
            version: data?.version || 'ready',
          });
          this.checkError.set(null);
        } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
          this.checkError.set('Could not prepare the web update. Try again later.');
        }
      });
    }
  }

  markVersionAsSeen(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SEEN_VERSION, this.currentVersion);
      } catch {}
    }
    this.unseenNotes.set(false);
  }

  private readDismissal(): { id: string; until: number } | null {
    try {
      const value = JSON.parse(localStorage.getItem('mehrchain_update_later') || 'null');
      return value && typeof value.id === 'string' && Number.isFinite(value.until) ? value : null;
    } catch {
      return null;
    }
  }

  dismissUpdate(): void {
    const update = this.availableUpdate();
    if (!update) return;
    const value = { id: update.id, until: Date.now() + 24 * 60 * 60 * 1000 };
    this.dismissed.set(value);
    try {
      localStorage.setItem('mehrchain_update_later', JSON.stringify(value));
    } catch {}
  }

  async checkForUpdates(manual = false): Promise<void> {
    this.now.set(Date.now());
    if (this.checking() || (!manual && Date.now() - this.lastCheck < 60 * 60 * 1000)) return;
    this.lastCheck = Date.now();
    this.checking.set(true);
    this.checkError.set(null);
    try {
      if (this.platform === 'android' && this.http) {
        const installed = await firstValueFrom(from(this.installedRelease()).pipe(timeout(3000)));
        if (installed.debug || installed.applicationId !== APP_VERSION.applicationId) {
          if (manual)
            this.checkError.set('This preview build cannot install official Android updates.');
          return;
        }
        const result = await firstValueFrom(
          this.http
            .get<{ release: unknown }>('https://mehrchain.pages.dev/updates/android')
            .pipe(timeout(10000)),
        );
        if (
          eligibleAndroidRelease(
            result.release,
            installed.version,
            installed.versionCode,
            installed.certificateSha256,
          )
        ) {
          this.availableUpdate.set({
            kind: 'android',
            id: `apk:${result.release.version}:${result.release.versionCode}`,
            version: result.release.version,
            release: result.release,
          });
        } else {
          this.availableUpdate.set(null);
        }
      } else if (this.platform === 'web' && this.swUpdate?.isEnabled) {
        await firstValueFrom(from(this.swUpdate.checkForUpdate()).pipe(timeout(10000)));
      }
      this.checked.set(true);
    } catch {
      this.checkError.set(
        'Could not check updates. Your habits are still available. Try again later.',
      );
    } finally {
      this.checking.set(false);
    }
  }

  async activateUpdate(): Promise<void> {
    const update = this.availableUpdate();
    if (!update) return;
    if (update.kind === 'android' && update.release) {
      if (
        !this.actions.confirm(
          `Download MehrChain ${update.version}? Android will ask you to install it. If the download fails, retry here. Your account and habits stay on this device.`,
        )
      )
        return;
      try {
        this.actions.download(update.release.url);
      } catch {
        this.checkError.set('Could not open the download. Please try again.');
      }
    } else if (update.kind === 'web') {
      if (!this.actions.confirm('Reload to update MehrChain? Finish or save any open form first.'))
        return;
      this.actions.reload();
    }
  }
}
