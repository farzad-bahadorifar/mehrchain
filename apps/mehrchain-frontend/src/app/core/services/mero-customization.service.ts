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
    name: 'مهر طلایی',
    nameEn: 'Golden Warmth',
    lightGradient:
      'radial-gradient(circle, rgba(254, 240, 138, 0.85) 0%, rgba(245, 158, 11, 0.4) 45%, transparent 72%)',
    darkGradient:
      'radial-gradient(circle, rgba(254, 240, 138, 0.9) 0%, rgba(245, 158, 11, 0.5) 45%, transparent 72%)',
    previewColor: '#f59e0b',
    accentColor: '#d97706',
    minStreak: 0,
    description: 'گرمی و روشنایی کلاسیک خورشید مهر',
  },
  {
    id: 'ocean',
    name: 'اقیانوس آرام',
    nameEn: 'Calm Breeze',
    lightGradient:
      'radial-gradient(circle, rgba(186, 230, 253, 0.9) 0%, rgba(14, 165, 233, 0.45) 45%, transparent 72%)',
    darkGradient:
      'radial-gradient(circle, rgba(56, 189, 248, 0.95) 0%, rgba(2, 132, 199, 0.55) 45%, transparent 75%)',
    previewColor: '#0ea5e9',
    accentColor: '#0284c7',
    minStreak: 0,
    description: 'امواج زلال و حس آرامش بیکران',
  },
  {
    id: 'nebula',
    name: 'کیهان نئونی',
    nameEn: 'Cyber Nebula',
    lightGradient:
      'radial-gradient(circle, rgba(245, 208, 254, 0.9) 0%, rgba(168, 85, 247, 0.45) 45%, transparent 72%)',
    darkGradient:
      'radial-gradient(circle, rgba(192, 132, 252, 0.95) 0%, rgba(147, 51, 234, 0.55) 45%, transparent 75%)',
    previewColor: '#a855f7',
    accentColor: '#9333ea',
    minStreak: 0,
    description: 'درخشش کهکشانی و جادوی شب',
  },
  {
    id: 'emerald',
    name: 'جوانه امید',
    nameEn: 'Emerald Spring',
    lightGradient:
      'radial-gradient(circle, rgba(187, 247, 208, 0.9) 0%, rgba(34, 197, 94, 0.45) 45%, transparent 72%)',
    darkGradient:
      'radial-gradient(circle, rgba(74, 222, 128, 0.95) 0%, rgba(22, 163, 74, 0.55) 45%, transparent 75%)',
    previewColor: '#22c55e',
    accentColor: '#16a34a',
    minStreak: 0,
    description: 'انرژی رویش و سرسبزی طبیعت',
  },
  {
    id: 'sakura',
    name: 'شکوفه گیلاس',
    nameEn: 'Sakura Dream',
    lightGradient:
      'radial-gradient(circle, rgba(254, 205, 211, 0.9) 0%, rgba(244, 63, 94, 0.45) 45%, transparent 72%)',
    darkGradient:
      'radial-gradient(circle, rgba(251, 113, 133, 0.95) 0%, rgba(225, 29, 72, 0.55) 45%, transparent 75%)',
    previewColor: '#f43f5e',
    accentColor: '#e11d48',
    minStreak: 0,
    description: 'لطافت، مهربانی و عشق بی‌پایان',
  },
  {
    id: 'aurora',
    name: 'شفق قطبی',
    nameEn: 'Aurora Borealis',
    lightGradient:
      'radial-gradient(circle, rgba(167, 243, 208, 0.9) 0%, rgba(45, 212, 191, 0.5) 35%, rgba(99, 102, 241, 0.3) 65%, transparent 75%)',
    darkGradient:
      'radial-gradient(circle, rgba(52, 211, 153, 0.95) 0%, rgba(20, 184, 166, 0.6) 35%, rgba(129, 140, 248, 0.45) 65%, transparent 78%)',
    previewColor: '#14b8a6',
    accentColor: '#0d9488',
    minStreak: 3,
    badge: '۳ روز پیوسته',
    description: 'رقص جادویی نورهای قطبی در آسمان شب',
  },
  {
    id: 'cosmic_fire',
    name: 'شعله کیهانی',
    nameEn: 'Cosmic Fire',
    lightGradient:
      'radial-gradient(circle, rgba(254, 240, 138, 0.95) 0%, rgba(249, 115, 22, 0.55) 40%, rgba(239, 68, 68, 0.35) 65%, transparent 75%)',
    darkGradient:
      'radial-gradient(circle, rgba(253, 224, 71, 0.95) 0%, rgba(249, 115, 22, 0.65) 40%, rgba(220, 38, 38, 0.5) 65%, transparent 78%)',
    previewColor: '#f97316',
    accentColor: '#ea580c',
    minStreak: 7,
    badge: '۷ روز پیوسته',
    description: 'تپش قدرتمند اراده و اشتیاق سوزان',
  },
];

export const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'energetic',
    title: 'پرانرژی و پرشور',
    subtitle: 'انگیزه‌بخش، پرهیجان و مشتاق',
    emoji: '⚡',
    icon: 'zap',
    greeting: (name) => `${name} پر از انرژیه و آماده ترکوندنه! 🔥`,
    streakPraise: (name, days) =>
      `عالیه! ${days} روز فوق‌العاده پشت سر هم، هیچ‌چیز جلوت رو نمی‌گیره! 🚀`,
  },
  {
    id: 'calm',
    title: 'آرامش‌بخش و صبور',
    subtitle: 'همراه مهربان، بدون استرس و پیوسته',
    emoji: '🧘',
    icon: 'leaf',
    greeting: (name) => `${name} در کنارت با آرامش همراهه. 🌸`,
    streakPraise: (name, days) =>
      `آفرین به صبوری و تداومت، ${days} روز قدم‌های پیوسته و زیبا. 🍃`,
  },
  {
    id: 'focused',
    title: 'جدی و هدفمند',
    subtitle: 'تمرکز بالا، دقیق و بدون حاشیه',
    emoji: '🎯',
    icon: 'sparkles',
    greeting: (name) => `${name} منتظر تحقق اهداف امروزه. 🎯`,
    streakPraise: (name, days) =>
      `هدف‌گیری دقیق! ${days} روز بدون حتی یک شکست ثبت شد. ⚔️`,
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
  readonly nickname = signal<string>('مِرو');
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
