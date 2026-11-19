import { TestBed } from '@angular/core/testing';
import { VersionService, CURRENT_APP_VERSION, APP_CHANGELOG } from './version.service';
import { APP_VERSION } from '../../../environments/app-version';
import { ApplicationRef } from '@angular/core';
import { NEVER, Subject } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UPDATE_ACTIONS, UPDATE_PLATFORM } from './version.service';
import { INSTALLED_RELEASE } from '../utils/native-release';

describe('VersionService', () => {
  let service: VersionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [VersionService],
    });
    service = TestBed.inject(VersionService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and have current version', () => {
    expect(service).toBeTruthy();
    expect(service.currentVersion).toBe(CURRENT_APP_VERSION);
    expect(service.changelog).toEqual(APP_CHANGELOG);
  });

  it('should indicate hasNewVersion true when version has not been marked as seen', () => {
    expect(service.hasNewVersion()).toBe(true);
  });

  it('should mark version as seen and set hasNewVersion to false', () => {
    service.markVersionAsSeen();
    expect(service.hasNewVersion()).toBe(false);
    expect(localStorage.getItem('mehrchain_last_seen_version')).toBe(CURRENT_APP_VERSION);
  });

  it('should initialize hasNewVersion to false if current version was already seen', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('mehrchain_last_seen_version', CURRENT_APP_VERSION);
    TestBed.configureTestingModule({
      providers: [VersionService],
    });
    const newService = TestBed.inject(VersionService);
    expect(newService.hasNewVersion()).toBe(false);
  });
});

describe('platform update lifecycle', () => {
  const updates = new Subject<any>();
  const installed = vi.fn(async () => ({
    version: '1.0.0-rc.4',
    versionCode: 4,
    applicationId: APP_VERSION.applicationId,
    certificateSha256: 'b'.repeat(64),
    debug: false,
  }));
  const settle = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };
  const actions = { reload: vi.fn(), download: vi.fn(), confirm: vi.fn(() => true) };
  const sw = { isEnabled: true, versionUpdates: updates, checkForUpdate: vi.fn(async () => false) };
  const ready = {
    type: 'VERSION_READY',
    currentVersion: { hash: 'old' },
    latestVersion: { hash: 'new', appData: { version: '1.0.1' } },
  };
  const release = {
    version: '1.0.1',
    versionCode: 5,
    applicationId: APP_VERSION.applicationId,
    certificateSha256: 'b'.repeat(64),
    url: 'https://github.com/farzad-bahadorifar/mehrchain/releases/download/v1.0.1/mehrchain-release.apk',
    sha256: 'a'.repeat(64),
    size: 100,
  };
  const setup = (platform: string) => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApplicationRef, useValue: { isStable: NEVER } },
        { provide: UPDATE_PLATFORM, useValue: platform },
        { provide: UPDATE_ACTIONS, useValue: actions },
        { provide: INSTALLED_RELEASE, useValue: installed },
        { provide: SwUpdate, useValue: sw },
      ],
    });
    return TestBed.inject(VersionService);
  };
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    actions.confirm.mockReturnValue(true);
  });
  afterEach(() => {
    try {
      TestBed.inject(HttpTestingController).verify();
    } finally {
      TestBed.resetTestingModule();
      localStorage.clear();
    }
  });
  it('keeps a ready web update when profile marks local notes as seen', async () => {
    const service = setup('web');
    updates.next(ready);
    service.markVersionAsSeen();
    expect(service.availableUpdate()?.version).toBe('1.0.1');
    expect(service.hasNewVersion()).toBe(true);
    service.dismissUpdate();
    expect(service.showUpdateNotice()).toBe(false);
    expect(JSON.parse(localStorage.getItem('mehrchain_update_later')!).id).toBe('new');
    await service.activateUpdate();
    expect(actions.reload).toHaveBeenCalledOnce();
    expect(actions.download).not.toHaveBeenCalled();
  });
  it('does not reload without user consent or treat a web update as an APK', async () => {
    const service = setup('web');
    updates.next(ready);
    actions.confirm.mockReturnValue(false);
    await service.activateUpdate();
    expect(actions.reload).not.toHaveBeenCalled();
    expect(actions.download).not.toHaveBeenCalled();
    await service.checkForUpdates(true);
    expect(sw.checkForUpdate).toHaveBeenCalledOnce();
  });
  it('discovers Android metadata without auth headers and ignores web readiness', async () => {
    const service = setup('android');
    updates.next(ready);
    expect(service.availableUpdate()).toBeNull();
    const checking = service.checkForUpdates(true);
    await settle();
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://mehrchain.pages.dev/updates/android',
    );
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ release });
    await checking;
    await service.activateUpdate();
    expect(actions.download).toHaveBeenCalledWith(release.url);
    expect(actions.reload).not.toHaveBeenCalled();
    expect(sw.checkForUpdate).not.toHaveBeenCalled();
  });
  it('deduplicates checks, tolerates network failure and supports explicit retry', async () => {
    const service = setup('android');
    const http = TestBed.inject(HttpTestingController);
    const checking = service.checkForUpdates(true);
    await service.checkForUpdates(true);
    await settle();
    http
      .expectOne('https://mehrchain.pages.dev/updates/android')
      .flush({}, { status: 503, statusText: 'Offline' });
    await checking;
    expect(service.checkError()).toContain('Your habits');
    await service.checkForUpdates();
    http.expectNone('https://mehrchain.pages.dev/updates/android');
    const retry = service.checkForUpdates(true);
    await settle();
    http.expectOne('https://mehrchain.pages.dev/updates/android').flush({ release: null });
    await retry;
    expect(service.checkError()).toBeNull();
    expect(service.availableUpdate()).toBeNull();
  });
  it('rejects untrusted download URLs', async () => {
    const service = setup('android');
    const checking = service.checkForUpdates(true);
    await settle();
    TestBed.inject(HttpTestingController)
      .expectOne('https://mehrchain.pages.dev/updates/android')
      .flush({ release: { ...release, url: 'https://evil.test/app.apk' } });
    await checking;
    expect(service.availableUpdate()).toBeNull();
  });
  it('refuses official updates for debug installations or a different signing key', async () => {
    const service = setup('android');
    installed.mockResolvedValueOnce({
      version: '1.0.0-rc.4',
      versionCode: 4,
      applicationId: APP_VERSION.applicationId,
      certificateSha256: 'b'.repeat(64),
      debug: true,
    });
    await service.checkForUpdates(true);
    TestBed.inject(HttpTestingController).expectNone('https://mehrchain.pages.dev/updates/android');
    const checking = service.checkForUpdates(true);
    await settle();
    TestBed.inject(HttpTestingController)
      .expectOne('https://mehrchain.pages.dev/updates/android')
      .flush({ release: { ...release, certificateSha256: 'c'.repeat(64) } });
    await checking;
    expect(service.availableUpdate()).toBeNull();
  });
  it('persists Later across restarts, allows a different update and releases listeners', () => {
    const first = setup('web');
    updates.next(ready);
    first.dismissUpdate();
    TestBed.resetTestingModule();
    const next = setup('web');
    updates.next(ready);
    expect(next.showUpdateNotice()).toBe(false);
    updates.next({ ...ready, latestVersion: { hash: 'later', appData: { version: '1.0.2' } } });
    expect(next.showUpdateNotice()).toBe(true);
    TestBed.resetTestingModule();
    updates.next({ ...ready, latestVersion: { hash: 'after-destroy' } });
    expect(next.availableUpdate()?.id).toBe('later');
    setup('web'); // Leave a testing backend for the shared teardown assertion.
  });
});
