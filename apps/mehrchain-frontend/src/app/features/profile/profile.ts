import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  MeroCustomizationService,
  MeroGlowThemeId,
  MeroPersonality,
} from '../../core/services/mero-customization.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroComponent } from '../../shared/components/mero/mero';

export interface PresetCustomColor {
  name: string;
  hex: string;
}

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MeroComponent,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  customization = inject(MeroCustomizationService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  commitmentService = inject(CommitmentService);

  // Nickname Editing State
  nicknameInput = signal<string>(this.customization.nickname());
  isEditingNickname = signal<boolean>(false);
  saveFeedbackMessage = signal<string | null>(null);

  // Custom Glow 21-Day Studio State
  customColorInput = signal<string>(this.customization.customGlowColor());
  customNameInput = signal<string>(this.customization.customGlowName());
  isCustomStudioOpen = signal<boolean>(false);

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

  // Temporary Preview of Theme
  hoveredThemeId = signal<MeroGlowThemeId | null>(null);

  // User details
  currentUser = this.authService.currentUser;
  currentStreak = this.commitmentService.overallStreak;
  activeHabitsCount = computed(() => this.commitmentService.commitments().length);

  // 21-day Streak progress
  isCustomThemeUnlocked = computed(() => this.currentStreak() >= 21);
  customStreakProgress = computed(() =>
    Math.min(100, Math.round((this.currentStreak() / 21) * 100))
  );

  // Dynamic Theme Counts
  unlockedThemesCount = this.customization.unlockedThemesCount;
  totalThemesCount = computed(() => this.customization.availableThemes().length);

  // Effective preview gradient for Hero Mero
  heroPreviewGradient = computed(() => {
    const hovered = this.hoveredThemeId();
    if (hovered) {
      const theme = this.customization.availableThemes().find((t) => t.id === hovered);
      if (theme) {
        return this.themeService.isDark() ? theme.darkGradient : theme.lightGradient;
      }
    }
    return this.customization.effectiveGlowGradient();
  });

  startEditingNickname(): void {
    this.nicknameInput.set(this.customization.nickname());
    this.isEditingNickname.set(true);
  }

  saveNickname(): void {
    const val = this.nicknameInput().trim();
    if (val.length > 0) {
      this.customization.setNickname(val);
      this.isEditingNickname.set(false);
      this.showSaveFeedback('Companion name saved successfully ✨');
    }
  }

  cancelEditingNickname(): void {
    this.nicknameInput.set(this.customization.nickname());
    this.isEditingNickname.set(false);
  }

  handleSelectTheme(themeId: MeroGlowThemeId): void {
    const isUnlocked = this.customization.isThemeUnlocked()(themeId);
    if (!isUnlocked) {
      const theme = this.customization.availableThemes().find((t) => t.id === themeId);
      const req = theme?.minStreak ?? 0;
      this.showSaveFeedback(
        `Locked! Requires a ${req}-day streak (Current: ${this.currentStreak()}d) 🔒`
      );
      return;
    }

    const success = this.customization.setGlowTheme(themeId);
    if (success) {
      if (themeId === 'custom') {
        this.isCustomStudioOpen.set(true);
        this.showSaveFeedback('Active glow set to your Custom Palette 🎨');
      } else {
        this.showSaveFeedback('Mero belly glow updated successfully 🌟');
      }
    }
  }

  toggleCustomStudio(): void {
    this.isCustomStudioOpen.update((v) => !v);
  }

  applyPresetCustomColor(preset: PresetCustomColor): void {
    this.customColorInput.set(preset.hex);
    this.customNameInput.set(preset.name);
  }

  saveCustomGlow(): void {
    if (!this.isCustomThemeUnlocked()) {
      this.showSaveFeedback('Custom Glow Studio unlocks at a 21-day streak 🔒');
      return;
    }

    const name = this.customNameInput().trim() || 'Custom Aura';
    const color = this.customColorInput().trim() || '#8b5cf6';

    this.customization.setCustomGlow(name, color);
    this.customization.setGlowTheme('custom');
    this.showSaveFeedback(`Custom glow "${name}" saved & applied to Mero! ✨`);
  }

  handleSelectPersonality(p: MeroPersonality): void {
    this.customization.setPersonality(p);
    this.showSaveFeedback('Mero personality updated 💬');
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
      await this.authService.deleteAccount();
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
