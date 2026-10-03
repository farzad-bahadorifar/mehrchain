import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

export interface ReleaseNote {
  version: string;
  title: string;
  date: string;
  isLatest: boolean;
  highlights: string[];
}

export const CURRENT_APP_VERSION = '1.0.0';
const STORAGE_KEY_SEEN_VERSION = 'mehrchain_last_seen_version';

export const APP_CHANGELOG: ReleaseNote[] = [
  {
    version: '1.0.0',
    title: 'Official Launch Release',
    date: 'Oct 2026',
    isLatest: true,
    highlights: [
      'Spark Button — energized habit completion with CSS glow pulse',
      'Endless Journey — habit tracking with no artificial deadlines (-1)',
      'Milestones & Badges — 5 companion badges for streaks & kindness',
      '21-Day Custom Glow Studio — unlock signature aura colors for Mero',
      'Support Chains — link habits with friends via invite links',
      'Google 1-Click Sign-In & OTP verification',
      'Fast Skeleton Loaders & server warmup notifications',
      'Mindful Reads — upcoming Articles preview in Chain',
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

  readonly currentVersion = CURRENT_APP_VERSION;
  readonly changelog = APP_CHANGELOG;

  readonly hasNewVersion = signal<boolean>(this.checkIfNewVersion());

  constructor() {
    this.initSwUpdateListener();
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
    if (this.swUpdate && this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.hasNewVersion.set(true);
        });
    }
  }

  markVersionAsSeen(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SEEN_VERSION, this.currentVersion);
      } catch {}
    }
    this.hasNewVersion.set(false);
  }

  async activateUpdate(): Promise<void> {
    if (this.swUpdate && this.swUpdate.isEnabled) {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    }
  }
}
