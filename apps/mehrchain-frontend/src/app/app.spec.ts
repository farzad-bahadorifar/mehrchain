import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { commonTestProviders } from '../testing/test-providers';
import { ChainService } from './core/services/chain.service';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let chainService: ChainService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    chainService = TestBed.inject(ChainService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should display unread dot when chainService has unread activity and navbar is visible', () => {
    component.showNavbar.set(true);
    chainService.hasUnread.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const unreadDot = compiled.querySelector('span[aria-label="New activity"]');
    expect(unreadDot).toBeTruthy();

    chainService.hasUnread.set(false);
    fixture.detectChanges();
    const unreadDotRemoved = compiled.querySelector('span[aria-label="New activity"]');
    expect(unreadDotRemoved).toBeFalsy();
  });

  it('should display blue version notification dot on Profile tab when new version is available', () => {
    component.showNavbar.set(true);
    component.versionService.hasNewVersion.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const versionDot = compiled.querySelector('span[aria-label="New version available"]');
    expect(versionDot).toBeTruthy();

    component.versionService.hasNewVersion.set(false);
    fixture.detectChanges();
    const versionDotRemoved = compiled.querySelector('span[aria-label="New version available"]');
    expect(versionDotRemoved).toBeFalsy();
  });
});
