import { TestBed } from '@angular/core/testing';
import {
  MeroCustomizationService,
  DEFAULT_GLOW_THEME,
} from './mero-customization.service';
import { CommitmentService } from './commitment.service';
import { ThemeService } from './theme.service';
import { signal } from '@angular/core';

describe('MeroCustomizationService', () => {
  let service: MeroCustomizationService;
  let mockStreakSignal: any;
  let mockIsDarkSignal: any;

  beforeEach(() => {
    localStorage.clear();
    mockStreakSignal = signal(0);
    mockIsDarkSignal = signal(false);

    const mockCommitmentService = {
      overallStreak: mockStreakSignal,
    };

    const mockThemeService = {
      isDark: mockIsDarkSignal,
    };

    TestBed.configureTestingModule({
      providers: [
        MeroCustomizationService,
        { provide: CommitmentService, useValue: mockCommitmentService },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    });

    service = TestBed.inject(MeroCustomizationService);
  });

  it('should initialize with default values', () => {
    expect(service.nickname()).toBe('Mero');
    expect(service.selectedThemeId()).toBe('golden');
    expect(service.personality()).toBe('calm');
    expect(service.activeTheme().id).toBe('golden');
  });

  it('should update nickname correctly when valid', () => {
    service.setNickname('Sparky');
    expect(service.nickname()).toBe('Sparky');

    // Should ignore empty or whitespace-only names
    service.setNickname('   ');
    expect(service.nickname()).toBe('Sparky');
  });

  it('should adapt effective gradient based on dark mode', () => {
    mockIsDarkSignal.set(false);
    expect(service.effectiveGlowGradient()).toBe(DEFAULT_GLOW_THEME.lightGradient);

    mockIsDarkSignal.set(true);
    expect(service.effectiveGlowGradient()).toBe(DEFAULT_GLOW_THEME.darkGradient);
  });

  it('should update personality mode and generate matching greetings', () => {
    service.setPersonality('energetic');
    expect(service.personality()).toBe('energetic');
    expect(service.getGreeting()).toContain('bursting with energy');

    service.setPersonality('focused');
    expect(service.getGreeting()).toContain('locked in');
  });

  it('should unlock 21-day custom theme when streak reaches 21 and allow setting custom glow', () => {
    mockStreakSignal.set(10);
    expect(service.setGlowTheme('custom')).toBe(false);

    mockStreakSignal.set(21);
    expect(service.setGlowTheme('custom')).toBe(true);
    expect(service.selectedThemeId()).toBe('custom');

    service.setCustomGlow('Mystic Nebula', '#06b6d4');
    expect(service.customGlowName()).toBe('Mystic Nebula');
    expect(service.customGlowColor()).toBe('#06b6d4');
    expect(service.activeTheme().name).toBe('Mystic Nebula');
    expect(service.activeTheme().previewColor).toBe('#06b6d4');

    // Reset back to default glow
    service.resetToDefaultGlow();
    expect(service.selectedThemeId()).toBe('golden');
  });
});
