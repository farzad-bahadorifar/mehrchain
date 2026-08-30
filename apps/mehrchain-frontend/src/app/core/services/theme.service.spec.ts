import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService (Frontend)', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should initialize with default system or stored mode', () => {
    expect(['light', 'dark', 'system']).toContain(service.mode());
  });

  it('should apply dark theme and add .dark class to root document', () => {
    service.setTheme('dark');
    TestBed.flushEffects();

    expect(service.mode()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('mehrchain_theme_mode_v1')).toBe('dark');
  });

  it('should apply light theme and remove .dark class from root document', () => {
    document.documentElement.classList.add('dark');

    service.setTheme('light');
    TestBed.flushEffects();

    expect(service.mode()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('mehrchain_theme_mode_v1')).toBe('light');
  });
});
