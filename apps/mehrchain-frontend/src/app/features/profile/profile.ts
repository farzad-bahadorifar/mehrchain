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

  // Temporary Preview of Theme
  hoveredThemeId = signal<MeroGlowThemeId | null>(null);

  // Effective preview gradient for Hero Mero
  heroPreviewGradient = computed(() => {
    const hovered = this.hoveredThemeId();
    if (hovered) {
      const theme = this.customization.availableThemes.find((t) => t.id === hovered);
      if (theme) {
        return this.themeService.isDark() ? theme.darkGradient : theme.lightGradient;
      }
    }
    return this.customization.effectiveGlowGradient();
  });

  // User details
  currentUser = this.authService.currentUser;
  currentStreak = this.commitmentService.overallStreak;
  activeHabitsCount = computed(() => this.commitmentService.commitments().length);

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
      const theme = this.customization.availableThemes.find((t) => t.id === themeId);
      this.showSaveFeedback(
        `This glow theme requires a ${theme?.minStreak ?? 0}-day streak 🔒`
      );
      return;
    }

    const success = this.customization.setGlowTheme(themeId);
    if (success) {
      this.showSaveFeedback('Mero belly glow updated successfully 🌟');
    }
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

  private showSaveFeedback(msg: string): void {
    this.saveFeedbackMessage.set(msg);
    setTimeout(() => {
      if (this.saveFeedbackMessage() === msg) {
        this.saveFeedbackMessage.set(null);
      }
    }, 3200);
  }
}
