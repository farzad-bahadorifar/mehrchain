import { Injectable, computed, inject, signal } from '@angular/core';
import { CommitmentService } from './commitment.service';
import { ThemeService } from './theme.service';

export type MeroGlowThemeId =
  | 'golden'
  | 'ocean'
  | 'nebula'
  | 'emerald'
  | 'sakura'
  | 'aurora'
  | 'cosmic_fire'
  | 'custom';

export type MeroPersonality = 'energetic' | 'calm' | 'focused';

export interface MeroGlowTheme {
  id: MeroGlowThemeId;
  name: string;
  nameEn: string;
  lightGradient: string;
  darkGradient: string;
  previewColor: string;
  accentColor: string;
  minStreak: number;
  badge?: string;
  description: string;
}

export interface PersonalityOption {
  id: MeroPersonality;
  title: string;
  subtitle: string;
  emoji: string;
  icon: string;
  greeting: (name: string) => string;
  streakPraise: (name: string, days: number) => string;
}

/**
 * Utility function to convert a Hex color code to RGBA string
 */
export function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return `rgba(139, 92, 246, ${alpha})`;
  }
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generate matching light and dark radial gradients from a given Hex color
 */
export function generateCustomGlowGradients(hex: string) {
  const lightCenter = hexToRgba(hex, 0.9);
  const lightMid = hexToRgba(hex, 0.45);
  const darkCenter = hexToRgba(hex, 0.95);
  const darkMid = hexToRgba(hex, 0.55);

  return {
    lightGradient: `radial-gradient(circle, ${lightCenter} 0%, ${lightMid} 45%, transparent 72%)`,
    darkGradient: `radial-gradient(circle, ${darkCenter} 0%, ${darkMid} 45%, transparent 75%)`,
  };
}

export const DEFAULT_GLOW_THEME: MeroGlowTheme = {
  id: 'golden',
  name: 'Golden Warmth',
  nameEn: 'Golden Warmth',
  lightGradient:
    'radial-gradient(circle, rgba(254, 240, 138, 0.85) 0%, rgba(245, 158, 11, 0.4) 45%, transparent 72%)',
  darkGradient:
    'radial-gradient(circle, rgba(254, 240, 138, 0.9) 0%, rgba(245, 158, 11, 0.5) 45%, transparent 72%)',
  previewColor: '#f59e0b',
  accentColor: '#d97706',
  minStreak: 0,
  description: 'Classic warmth and radiant sunshine',
};

export const MERO_GLOW_THEMES: MeroGlowTheme[] = [DEFAULT_GLOW_THEME];

export const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'energetic',
    title: 'Energetic & Vibrant',
    subtitle: 'Motivational, thrilling, and eager',
    emoji: '',
    icon: 'zap',
    greeting: (name) => `${name} is bursting with energy and ready to conquer the day!`,
    streakPraise: (name, days) =>
      `Incredible! ${days} amazing days in a row, nothing can stop you!`,
  },
  {
    id: 'calm',
    title: 'Calm & Mindful',
    subtitle: 'Gentle companion, stress-free and steady',
    emoji: '',
    icon: 'leaf',
    greeting: (name) => `${name} is right by your side with peace and serenity.`,
    streakPraise: (name, days) =>
      `Praise your patience and consistency, ${days} beautiful mindful steps.`,
  },
  {
    id: 'focused',
    title: 'Driven & Focused',
    subtitle: 'Laser focus, disciplined and razor-sharp',
    emoji: '',
    icon: 'sparkles',
    greeting: (name) => `${name} is locked in and ready to crush today's goals.`,
    streakPraise: (name, days) =>
      `Target locked! ${days} flawless consecutive days achieved.`,
  },
];

@Injectable({
  providedIn: 'root',
})
export class MeroCustomizationService {
  private readonly STORAGE_KEY = 'mehrchain_mero_customization_v1';
  private themeService = inject(ThemeService);
  private commitmentService = inject(CommitmentService);

  readonly baseThemes = MERO_GLOW_THEMES;
  readonly personalityOptions = PERSONALITY_OPTIONS;

  // Reactive State Signals
  readonly nickname = signal<string>('Mero');
  readonly selectedThemeId = signal<MeroGlowThemeId>('golden');
  readonly personality = signal<MeroPersonality>('calm');
  readonly customGlowColor = signal<string>('#8b5cf6');
  readonly customGlowName = signal<string>('Custom Aura');

  // Available Themes (Base + Dynamic 21-Day Custom Theme)
  readonly availableThemes = computed<MeroGlowTheme[]>(() => {
    const customHex = this.customGlowColor();
    const customName = this.customGlowName() || 'Custom Aura';
    const { lightGradient, darkGradient } = generateCustomGlowGradients(customHex);

    const customTheme: MeroGlowTheme = {
      id: 'custom',
      name: customName,
      nameEn: customName,
      lightGradient,
      darkGradient,
      previewColor: customHex,
      accentColor: customHex,
      minStreak: 21,
      badge: '21-Day Streak',
      description: 'Custom palette crafted by your 21-day dedication',
    };

    return [...this.baseThemes, customTheme];
  });

  // Active Glow Theme object
  readonly activeTheme = computed<MeroGlowTheme>(() => {
    const id = this.selectedThemeId();
    const themes = this.availableThemes();
    return themes.find((t) => t.id === id) ?? themes[0];
  });

  // Effective CSS gradient taking into account active Light / Dark mode
  readonly effectiveGlowGradient = computed<string>(() => {
    const theme = this.activeTheme();
    const isDark = this.themeService.isDark();
    return isDark ? theme.darkGradient : theme.lightGradient;
  });

  // Active personality metadata
  readonly activePersonality = computed<PersonalityOption>(() => {
    const p = this.personality();
    return this.personalityOptions.find((o) => o.id === p) ?? this.personalityOptions[1];
  });

  // Check if a specific theme is unlocked by user's streak
  readonly isThemeUnlocked = computed(() => {
    const streak = this.commitmentService.overallStreak();
    const themes = this.availableThemes();
    return (themeId: MeroGlowThemeId): boolean => {
      const theme = themes.find((t) => t.id === themeId);
      if (!theme) return false;
      return streak >= theme.minStreak;
    };
  });

  // Count of currently unlocked themes
  readonly unlockedThemesCount = computed<number>(() => {
    const isUnlocked = this.isThemeUnlocked();
    return this.availableThemes().filter((t) => isUnlocked(t.id)).length;
  });

  constructor() {
    this.loadState();
  }

  setNickname(newName: string): void {
    const trimmed = newName.trim();
    if (trimmed.length > 0 && trimmed.length <= 25) {
      this.nickname.set(trimmed);
      this.saveState();
    }
  }

  setGlowTheme(themeId: MeroGlowThemeId): boolean {
    const canUnlock = this.isThemeUnlocked()(themeId);
    if (!canUnlock) {
      return false;
    }
    this.selectedThemeId.set(themeId);
    this.saveState();
    return true;
  }

  setCustomGlow(name: string, hexColor: string): void {
    const trimmedName = name.trim();
    if (trimmedName.length > 0 && trimmedName.length <= 30) {
      this.customGlowName.set(trimmedName);
    }
    if (/^#?[0-9a-fA-F]{6}$/.test(hexColor.trim())) {
      const formatted = hexColor.startsWith('#') ? hexColor.trim() : `#${hexColor.trim()}`;
      this.customGlowColor.set(formatted);
    }
    this.saveState();
  }

  resetToDefaultGlow(): void {
    this.selectedThemeId.set('golden');
    this.saveState();
  }

  setPersonality(personality: MeroPersonality): void {
    this.personality.set(personality);
    this.saveState();
  }

  getGreeting(): string {
    return this.activePersonality().greeting(this.nickname());
  }

  getStreakPraise(streakDays: number): string {
    return this.activePersonality().streakPraise(this.nickname(), streakDays);
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.nickname && typeof parsed.nickname === 'string') {
          this.nickname.set(parsed.nickname);
        }
        if (parsed.customGlowColor && typeof parsed.customGlowColor === 'string') {
          this.customGlowColor.set(parsed.customGlowColor);
        }
        if (parsed.customGlowName && typeof parsed.customGlowName === 'string') {
          this.customGlowName.set(parsed.customGlowName);
        }
        if (
          parsed.selectedThemeId &&
          (this.baseThemes.some((t) => t.id === parsed.selectedThemeId) ||
            parsed.selectedThemeId === 'custom')
        ) {
          this.selectedThemeId.set(parsed.selectedThemeId);
        }
        if (
          parsed.personality &&
          this.personalityOptions.some((p) => p.id === parsed.personality)
        ) {
          this.personality.set(parsed.personality);
        }
      }
    } catch (err) {
      console.warn('[MeroCustomizationService] Failed to parse stored state:', err);
    }
  }

  private saveState(): void {
    try {
      const payload = {
        nickname: this.nickname(),
        selectedThemeId: this.selectedThemeId(),
        personality: this.personality(),
        customGlowColor: this.customGlowColor(),
        customGlowName: this.customGlowName(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('[MeroCustomizationService] Failed to save state:', err);
    }
  }
}

