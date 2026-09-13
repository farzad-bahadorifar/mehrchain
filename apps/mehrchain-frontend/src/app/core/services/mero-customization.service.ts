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
  | 'cosmic_fire';

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

export const MERO_GLOW_THEMES: MeroGlowTheme[] = [
  {
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
  },
  {
    id: 'ocean',
    name: 'Calm Breeze',
    nameEn: 'Calm Breeze',
    lightGradient:
      'radial-gradient(circle, rgba(186, 230, 253, 0.9) 0%, rgba(14, 165, 233, 0.45) 45%, transparent 72%)',
    darkGradient:
      'radial-gradient(circle, rgba(56, 189, 248, 0.95) 0%, rgba(2, 132, 199, 0.55) 45%, transparent 75%)',
    previewColor: '#0ea5e9',
    accentColor: '#0284c7',
    minStreak: 0,
    description: 'Crystal waves and serene tranquility',
  },
  {
    id: 'nebula',
    name: 'Cyber Nebula',
    nameEn: 'Cyber Nebula',
    lightGradient:
      'radial-gradient(circle, rgba(245, 208, 254, 0.9) 0%, rgba(168, 85, 247, 0.45) 45%, transparent 72%)',
    darkGradient:
      'radial-gradient(circle, rgba(192, 132, 252, 0.95) 0%, rgba(147, 51, 234, 0.55) 45%, transparent 75%)',
    previewColor: '#a855f7',
    accentColor: '#9333ea',
    minStreak: 0,
    description: 'Cosmic shimmer and nocturnal magic',
  },
  {
    id: 'emerald',
    name: 'Emerald Spring',
    nameEn: 'Emerald Spring',
    lightGradient:
      'radial-gradient(circle, rgba(187, 247, 208, 0.9) 0%, rgba(34, 197, 94, 0.45) 45%, transparent 72%)',
    darkGradient:
      'radial-gradient(circle, rgba(74, 222, 128, 0.95) 0%, rgba(22, 163, 74, 0.55) 45%, transparent 75%)',
    previewColor: '#22c55e',
    accentColor: '#16a34a',
    minStreak: 0,
    description: 'Vibrant growth and fresh nature energy',
  },
  {
    id: 'sakura',
    name: 'Sakura Dream',
    nameEn: 'Sakura Dream',
    lightGradient:
      'radial-gradient(circle, rgba(254, 205, 211, 0.9) 0%, rgba(244, 63, 94, 0.45) 45%, transparent 72%)',
    darkGradient:
      'radial-gradient(circle, rgba(251, 113, 133, 0.95) 0%, rgba(225, 29, 72, 0.55) 45%, transparent 75%)',
    previewColor: '#f43f5e',
    accentColor: '#e11d48',
    minStreak: 0,
    description: 'Softness, kindness, and eternal love',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    nameEn: 'Aurora Borealis',
    lightGradient:
      'radial-gradient(circle, rgba(167, 243, 208, 0.9) 0%, rgba(45, 212, 191, 0.5) 35%, rgba(99, 102, 241, 0.3) 65%, transparent 75%)',
    darkGradient:
      'radial-gradient(circle, rgba(52, 211, 153, 0.95) 0%, rgba(20, 184, 166, 0.6) 35%, rgba(129, 140, 248, 0.45) 65%, transparent 78%)',
    previewColor: '#14b8a6',
    accentColor: '#0d9488',
    minStreak: 3,
    badge: '3-Day Streak',
    description: 'Magical northern lights dancing across the sky',
  },
  {
    id: 'cosmic_fire',
    name: 'Cosmic Fire',
    nameEn: 'Cosmic Fire',
    lightGradient:
      'radial-gradient(circle, rgba(254, 240, 138, 0.95) 0%, rgba(249, 115, 22, 0.55) 40%, rgba(239, 68, 68, 0.35) 65%, transparent 75%)',
    darkGradient:
      'radial-gradient(circle, rgba(253, 224, 71, 0.95) 0%, rgba(249, 115, 22, 0.65) 40%, rgba(220, 38, 38, 0.5) 65%, transparent 78%)',
    previewColor: '#f97316',
    accentColor: '#ea580c',
    minStreak: 7,
    badge: '7-Day Streak',
    description: 'Fierce willpower and burning determination',
  },
];

export const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'energetic',
    title: 'Energetic & Vibrant',
    subtitle: 'Motivational, thrilling, and eager',
    emoji: '⚡',
    icon: 'zap',
    greeting: (name) => `${name} is bursting with energy and ready to conquer the day! 🔥`,
    streakPraise: (name, days) =>
      `Incredible! ${days} amazing days in a row, nothing can stop you! 🚀`,
  },
  {
    id: 'calm',
    title: 'Calm & Mindful',
    subtitle: 'Gentle companion, stress-free and steady',
    emoji: '🧘',
    icon: 'leaf',
    greeting: (name) => `${name} is right by your side with peace and serenity. 🌸`,
    streakPraise: (name, days) =>
      `Praise your patience and consistency, ${days} beautiful mindful steps. 🍃`,
  },
  {
    id: 'focused',
    title: 'Driven & Focused',
    subtitle: 'Laser focus, disciplined and razor-sharp',
    emoji: '🎯',
    icon: 'sparkles',
    greeting: (name) => `${name} is locked in and ready to crush today's goals. 🎯`,
    streakPraise: (name, days) =>
      `Target locked! ${days} flawless consecutive days achieved. ⚔️`,
  },
];

@Injectable({
  providedIn: 'root',
})
export class MeroCustomizationService {
  private readonly STORAGE_KEY = 'mehrchain_mero_customization_v1';
  private themeService = inject(ThemeService);
  private commitmentService = inject(CommitmentService);

  readonly availableThemes = MERO_GLOW_THEMES;
  readonly personalityOptions = PERSONALITY_OPTIONS;

  // Reactive State Signals
  readonly nickname = signal<string>('Mero');
  readonly selectedThemeId = signal<MeroGlowThemeId>('golden');
  readonly personality = signal<MeroPersonality>('calm');

  // Active Glow Theme object
  readonly activeTheme = computed<MeroGlowTheme>(() => {
    const id = this.selectedThemeId();
    return this.availableThemes.find((t) => t.id === id) ?? this.availableThemes[0];
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
    return (themeId: MeroGlowThemeId): boolean => {
      const theme = this.availableThemes.find((t) => t.id === themeId);
      if (!theme) return false;
      return streak >= theme.minStreak;
    };
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
        if (
          parsed.selectedThemeId &&
          this.availableThemes.some((t) => t.id === parsed.selectedThemeId)
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
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('[MeroCustomizationService] Failed to save state:', err);
    }
  }
}
