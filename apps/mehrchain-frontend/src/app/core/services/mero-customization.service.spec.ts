import { TestBed } from '@angular/core/testing';
import {
  MeroCustomizationService,
  MERO_GLOW_THEMES,
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

  it('should switch glow theme if unlocked', () => {
    // Ocean is unlocked by default (minStreak 0)
    const success = service.setGlowTheme('ocean');
    expect(success).toBe(true);
    expect(service.selectedThemeId()).toBe('ocean');
    expect(service.activeTheme().id).toBe('ocean');
  });

  it('should block locked themes if streak is insufficient', () => {
    mockStreakSignal.set(0);
    // Aurora requires streak 3
    const success = service.setGlowTheme('aurora');
    expect(success).toBe(false);
    expect(service.selectedThemeId()).toBe('golden');

    // Now raise streak to 3
    mockStreakSignal.set(3);
    const successAfterStreak = service.setGlowTheme('aurora');
    expect(successAfterStreak).toBe(true);
    expect(service.selectedThemeId()).toBe('aurora');
  });

  it('should adapt effective gradient based on dark mode', () => {
    service.setGlowTheme('ocean');
    const oceanTheme = MERO_GLOW_THEMES.find((t) => t.id === 'ocean')!;

    mockIsDarkSignal.set(false);
    expect(service.effectiveGlowGradient()).toBe(oceanTheme.lightGradient);

    mockIsDarkSignal.set(true);
    expect(service.effectiveGlowGradient()).toBe(oceanTheme.darkGradient);
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
  });
});
