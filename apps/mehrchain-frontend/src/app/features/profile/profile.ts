import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { VersionService } from '../../core/services/version.service';
import { MeroComponent } from '../../shared/components/mero/mero';
import { MeroMoodService } from '../../core/services/mero-mood.service';
import { UsernameSettingsComponent } from '../../shared/components/username-settings/username-settings';
import { PasswordSetupComponent } from '../../shared/components/password-setup/password-setup';

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
    MeroComponent,
    UsernameSettingsComponent,
    PasswordSetupComponent,
    RouterLink,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  readonly section: 'overview' | 'account' | 'badges' | 'colors' | 'settings' =
    inject(ActivatedRoute).snapshot.data['section'] ?? 'overview';
  readonly pageTitle = {
    overview: 'Profile & Companion',
    account: 'Account & security',
    badges: 'Milestones & Badges',
    colors: 'Your color collection',
    settings: 'Appearance & app',
  }[this.section];
  readonly badgeFilter = signal<'all' | 'earned' | 'locked'>('all');
  readonly selectedBadge = signal<ProfileBadge | null>(null);
  customization = inject(MeroCustomizationService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  commitmentService = inject(CommitmentService);
  versionService = inject(VersionService);
  readonly meroMood = inject(MeroMoodService);

  // What's New Collapsible State
  isWhatsNewExpanded = signal<boolean>(false);

  saveFeedbackMessage = signal<string | null>(null);
  saveFailed = signal(false);

  // Custom Glow 21-Day Studio State
  customColorInput = signal<string>(this.customization.customGlowColor());
  customNameInput = signal<string>(this.customization.customGlowName());
  editingSlot = signal(1);
  draftDirty = signal(false);
  colorNameLength = computed(() => Array.from(this.customNameInput()).length);
  private destroyed = false;
  private draftSession: string | null = null;
  readonly nextEmptySlot = computed(() => {
    const collection = this.customization.collection();
    if (!collection) return null;
    const used = new Set(collection.colors.map((c) => c.slot));
    for (let slot = 1; slot <= collection.capacity; slot++) if (!used.has(slot)) return slot;
    return null;
  });

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
  currentStreak = computed(() => this.customization.collection()?.currentStreak ?? 0);
  activeHabitsCount = computed(() => this.commitmentService.commitments().length);

  totalSparks = computed(() => {
    let count = 0;
    [
      ...this.commitmentService.commitments(),
      ...this.commitmentService.archivedCommitments(),
    ].forEach((c) => {
      count += c.currentDay || 0;
    });
    return count;
  });

  // 5 Initial Badges (Lucide icons only)
  badges = computed<ProfileBadge[]>(() => {
    const totalSparks = this.totalSparks();
    const streak = this.currentStreak();
    const hasChain = (this.customization.collection()?.acceptedPartners ?? 0) > 0;
    const hasSentSupport = this.customization.collection()?.hasSentSupport ?? false;

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
        isUnlocked: hasChain,
        progressText: hasChain ? 'Unlocked' : 'Connect through an accepted invite',
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
        name: '21-Day Milestone',
        description: 'One habit, 21 consecutive days; yours to keep',
        icon: 'trophy',
        isUnlocked: this.isCustomThemeUnlocked(),
        progressText: this.isCustomThemeUnlocked() ? 'Permanently earned' : `${streak} / 21 days`,
      },
      {
        id: 'kind-soul',
        name: 'Kind Soul',
        description: 'Support a friend along the chain',
        icon: 'heart',
        isUnlocked: hasSentSupport,
        progressText: hasSentSupport ? 'Unlocked' : 'Send a heart to a partner',
      },
    ];
  });

  unlockedBadgesCount = computed(() => this.badges().filter((b) => b.isUnlocked).length);
  readonly filteredBadges = computed(() =>
    this.badges().filter(
      (badge) =>
        this.badgeFilter() === 'all' ||
        (this.badgeFilter() === 'earned' ? badge.isUnlocked : !badge.isUnlocked),
    ),
  );
  setBadgeFilter(filter: string): void {
    if (filter === 'all' || filter === 'earned' || filter === 'locked') {
      this.badgeFilter.set(filter);
      this.selectedBadge.set(null);
    }
  }
  readonly previewGlowColor = computed(() =>
    this.draftDirty() && /^#[0-9a-f]{6}$/i.test(this.customColorInput())
      ? this.customColorInput()
      : undefined,
  );

  cancelColorEdit(): void {
    const state = this.customization.collection();
    const color = state?.colors.find((c) => c.slot === state.selectedSlot) ?? state?.colors[0];
    this.editingSlot.set(color?.slot ?? 1);
    this.customNameInput.set(color?.name ?? 'Custom Aura');
    this.customColorInput.set(color?.hex ?? '#8b5cf6');
    this.draftDirty.set(false);
    this.saveFeedbackMessage.set(null);
  }

  // 21-day Streak progress
  isCustomThemeUnlocked = this.customization.isUnlocked;
  customStreakProgress = computed(() =>
    Math.min(100, Math.round((this.currentStreak() / 21) * 100)),
  );

  constructor() {
    // Clear version notification dot when opening profile
    this.versionService.markVersionAsSeen();
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
    });
    effect(() => {
      const user = this.currentUser();
      untracked(() => {
        const key = user ? `${user.id}:${this.authService.getToken()}` : null;
        if (key === this.draftSession) return;
        this.draftSession = key;
        this.draftDirty.set(false);
        this.editingSlot.set(1);
        this.customNameInput.set('Custom Aura');
        this.customColorInput.set('#8b5cf6');
        this.saveFeedbackMessage.set(null);
      });
    });
    effect(() => {
      const state = this.customization.collection();
      untracked(() => {
        if (this.draftDirty() || !state) return;
        const color = state.colors.find((c) => c.slot === state.selectedSlot) ?? state.colors[0];
        this.editingSlot.set(color?.slot ?? 1);
        this.customNameInput.set(color?.name ?? 'Custom Aura');
        this.customColorInput.set(color?.hex ?? '#8b5cf6');
      });
    });
    void this.customization.refresh();
  }

  toggleWhatsNew(): void {
    this.isWhatsNewExpanded.update((v) => !v);
  }

  applyPresetCustomColor(preset: PresetCustomColor): void {
    this.draftDirty.set(true);
    this.customColorInput.set(preset.hex);
    this.customNameInput.set(preset.name);
  }

  beginEdit(slot: number): void {
    const color = this.customization.collection()?.colors.find((c) => c.slot === slot);
    this.editingSlot.set(slot);
    this.customNameInput.set(color?.name ?? 'Custom Aura');
    this.customColorInput.set(color?.hex ?? '#8b5cf6');
    this.draftDirty.set(true);
  }

  private sameSession(userId: string | undefined, token: string | null): boolean {
    return (
      !this.destroyed && this.currentUser()?.id === userId && this.authService.getToken() === token
    );
  }

  async saveCustomGlow(): Promise<void> {
    if (!this.isCustomThemeUnlocked()) {
      this.showSaveFeedback('Custom Glow Studio unlocks at a 21-day streak', true);
      return;
    }

    const name = this.customNameInput().trim();
    const color = this.customColorInput().trim();
    const userId = this.currentUser()?.id;
    const token = this.authService.getToken();

    try {
      await this.customization.saveColor(this.editingSlot(), name, color);
      if (!this.sameSession(userId, token)) return;
      this.draftDirty.set(false);
      this.customNameInput.set(this.customization.customGlowName());
      this.customColorInput.set(this.customization.customGlowColor());
      this.showSaveFeedback(`Color "${name}" saved & applied to your account.`);
    } catch (error) {
      if (!this.sameSession(userId, token)) return;
      this.showSaveFeedback(
        error instanceof Error ? error.message : 'Could not save glow. Try again.',
        true,
      );
    }
  }

  async useColor(slot: number): Promise<void> {
    const userId = this.currentUser()?.id;
    const token = this.authService.getToken();
    try {
      await this.customization.selectColor(slot);
      if (!this.sameSession(userId, token)) return;
      this.showSaveFeedback(slot === 0 ? 'Default warm glow applied' : 'Saved color applied');
    } catch (error) {
      if (!this.sameSession(userId, token)) return;
      this.showSaveFeedback(
        error instanceof Error ? error.message : 'Could not reset glow. Try again.',
        true,
      );
    }
  }

  resetToDefaultGlow(): Promise<void> {
    return this.useColor(0);
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

  private showSaveFeedback(msg: string, failed = false): void {
    this.saveFailed.set(failed);
    this.saveFeedbackMessage.set(msg);
    if (failed) return;
    setTimeout(() => {
      if (this.saveFeedbackMessage() === msg) {
        this.saveFeedbackMessage.set(null);
      }
    }, 3200);
  }
}
