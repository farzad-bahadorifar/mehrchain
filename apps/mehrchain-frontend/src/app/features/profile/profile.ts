import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  MeroCustomizationService,
} from '../../core/services/mero-customization.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { ChainService } from '../../core/services/chain.service';
import { VersionService } from '../../core/services/version.service';
import { ProfileMeroComponent } from './profile-mero/profile-mero';
import { MeroMoodService } from '../../core/services/mero-mood.service';

export interface PresetCustomColor {
  name: string;
  hex: string;
}

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progressText: string;
}

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ProfileMeroComponent,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  customization = inject(MeroCustomizationService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  commitmentService = inject(CommitmentService);
  chainService = inject(ChainService);
  versionService = inject(VersionService);
  meroMood = inject(MeroMoodService);

  // What's New Collapsible State
  isWhatsNewExpanded = signal<boolean>(false);

  // Nickname Editing State
  nicknameInput = signal<string>(this.customization.nickname());
  isEditingNickname = signal<boolean>(false);
  saveFeedbackMessage = signal<string | null>(null);

  // Custom Glow 21-Day Studio State
  customColorInput = signal<string>(this.customization.customGlowColor());
  customNameInput = signal<string>(this.customization.customGlowName());

  readonly PRESET_CUSTOM_COLORS: PresetCustomColor[] = [
    { name: 'Royal Violet', hex: '#8b5cf6' },
    { name: 'Cyber Cyan', hex: '#06b6d4' },
    { name: 'Ruby Glow', hex: '#f43f5e' },
    { name: 'Emerald Flare', hex: '#10b981' },
    { name: 'Electric Sunset', hex: '#f97316' },
    { name: 'Solar Amber', hex: '#f59e0b' },
    { name: 'Mystic Indigo', hex: '#6366f1' },
    { name: 'Neon Fuchsia', hex: '#d946ef' },
    { name: 'Teal Aurora', hex: '#14b8a6' },
    { name: 'Lime Spark', hex: '#84cc16' },
  ];

  // User details
  currentUser = this.authService.currentUser;
  currentStreak = this.commitmentService.overallStreak;
  activeHabitsCount = computed(() => this.commitmentService.commitments().length);

  totalSparks = computed(() => {
    let count = 0;
    this.commitmentService.commitments().forEach((c) => {
      if (c.history) count += c.history.length;
    });
    return count;
  });

  // 5 Initial Badges (Lucide icons only)
  badges = computed<ProfileBadge[]>(() => {
    const totalSparks = this.totalSparks();
    const streak = this.currentStreak();
    const connections = this.chainService.connections();
    const hasPublicOrChain =
      connections.length > 0 || this.commitmentService.commitments().some((c) => c.isPublic);
    const hasHeartReaction = connections.some(
      (c) => c.heartSent === true || (c.lastPartnerActivityAt && c.status === 'ACTIVE')
    );

    return [
      {
        id: 'first-spark',
        name: 'First Spark',
        description: 'Complete your first habit ever',
        icon: 'sparkles',
        isUnlocked: totalSparks >= 1,
        progressText: totalSparks >= 1 ? 'Unlocked' : `${totalSparks} / 1 spark`,
      },
      {
        id: 'chain-starter',
        name: 'Chain Starter',
        description: 'Form your first chain connection',
        icon: 'link',
        isUnlocked: hasPublicOrChain,
        progressText: hasPublicOrChain ? 'Unlocked' : 'Create public habit or invite',
      },
      {
        id: '7-day-streak',
        name: '7-Day Streak',
        description: 'Keep a flame burning for 7 days',
        icon: 'flame',
        isUnlocked: streak >= 7,
        progressText: streak >= 7 ? 'Unlocked' : `${streak} / 7 days`,
      },
      {
        id: '21-day-master',
        name: '21-Day Master',
        description: '21 days streak (unlocks custom glow)',
        icon: 'trophy',
        isUnlocked: streak >= 21,
        progressText: streak >= 21 ? 'Unlocked' : `${streak} / 21 days`,
      },
      {
        id: 'kind-soul',
        name: 'Kind Soul',
        description: 'Support a friend along the chain',
        icon: 'heart',
        isUnlocked: hasHeartReaction || connections.length > 0,
        progressText: hasHeartReaction || connections.length > 0 ? 'Unlocked' : 'Support partner',
      },
    ];
  });

  unlockedBadgesCount = computed(() => this.badges().filter((b) => b.isUnlocked).length);

  // 21-day Streak progress
  isCustomThemeUnlocked = computed(() => this.currentStreak() >= 21);
  customStreakProgress = computed(() =>
    Math.min(100, Math.round((this.currentStreak() / 21) * 100))
  );

  constructor() {
    // Clear version notification dot when opening profile
    this.versionService.markVersionAsSeen();
  }

  toggleWhatsNew(): void {
    this.isWhatsNewExpanded.update((v) => !v);
  }

  startEditingNickname(): void {
    this.nicknameInput.set(this.customization.nickname());
    this.isEditingNickname.set(true);
  }

  saveNickname(): void {
    const val = this.nicknameInput().trim();
    if (val.length > 0) {
      this.customization.setNickname(val);
      this.isEditingNickname.set(false);
      this.showSaveFeedback('Companion name saved successfully');
    }
  }

  cancelEditingNickname(): void {
    this.nicknameInput.set(this.customization.nickname());
    this.isEditingNickname.set(false);
  }

  applyPresetCustomColor(preset: PresetCustomColor): void {
    this.customColorInput.set(preset.hex);
    this.customNameInput.set(preset.name);
  }

  saveCustomGlow(): void {
    if (!this.isCustomThemeUnlocked()) {
      this.showSaveFeedback('Custom Glow Studio unlocks at a 21-day streak');
      return;
    }

    const name = this.customNameInput().trim() || 'Custom Aura';
    const color = this.customColorInput().trim() || '#8b5cf6';

    this.customization.setCustomGlow(name, color);
    this.customization.setGlowTheme('custom');
    this.showSaveFeedback(`Custom glow "${name}" saved & applied to Mero!`);
  }

  resetToDefaultGlow(): void {
    this.customization.resetToDefaultGlow();
    this.showSaveFeedback('Reset to default warm glow');
  }

  setThemeMode(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
  }

  handleSignOut(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
    }
  }

  async handleDeleteAccount(): Promise<void> {
    if (
      confirm(
        'Are you sure you want to delete your account? All habits and consistency data will be permanently removed.',
      )
    ) {
      try {
        await this.authService.deleteAccount();
      } catch (err: any) {
        alert(err?.message || 'Account deletion failed. Please try again.');
      }
    }
  }

  private showSaveFeedback(msg: string): void {
    this.saveFeedbackMessage.set(msg);
    setTimeout(() => {
      if (this.saveFeedbackMessage() === msg) {
        this.saveFeedbackMessage.set(null);
      }
    }, 3200);
  }
}
