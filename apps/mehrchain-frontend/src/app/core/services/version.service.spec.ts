import { TestBed } from '@angular/core/testing';
import { VersionService, CURRENT_APP_VERSION, APP_CHANGELOG } from './version.service';

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
