import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ChainInvitePayload, ChainService } from '../../core/services/chain.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';
import { QrCodeComponent } from '../../shared/components/qr-code/qr-code';
import { MeroComponent } from '../../shared/components/mero/mero';

interface FloatingHeartItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

@Component({
  selector: 'app-chain',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    QrCodeComponent,
    MeroComponent,
  ],
  templateUrl: './chain.html',
  styleUrls: ['./chain.css'],
})
export class ChainComponent {
  public chainService = inject(ChainService);
  public commitmentService = inject(CommitmentService);
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  public customizationService = inject(MeroCustomizationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly publicCommitments = this.chainService.publicCommitments;
  readonly friendChains = this.chainService.friendChains;

  readonly selectedCommitmentId = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);
  readonly isQrModalOpen = signal<boolean>(false);
  readonly copied = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);

  // Incoming invite link parameters
  readonly incomingInvite = signal<ChainInvitePayload | null>(null);
  readonly inviteSelectedCommitmentId = signal<string>('');

  // Floating heart animations
  readonly floatingHearts = signal<FloatingHeartItem[]>([]);

  readonly selectedCommitment = computed(() => {
    const list = this.publicCommitments();
    if (list.length === 0) return null;
    const currentId = this.selectedCommitmentId();
    return list.find((c) => c.id === currentId) || list[0];
  });

  readonly currentInviteUrl = computed(() => {
    const commitment = this.selectedCommitment();
    return this.chainService.getInviteUrl(commitment ? commitment.id : undefined);
  });

  constructor() {
    const list = this.publicCommitments();
    if (list.length > 0) {
      this.selectedCommitmentId.set(list[0].id);
      this.inviteSelectedCommitmentId.set(list[0].id);
    }

    // Process incoming invite query params
    this.route.queryParams.subscribe((params) => {
      const parsed = this.chainService.parseInviteParams(params);
      if (parsed) {
        this.incomingInvite.set(parsed);
        const pubList = this.publicCommitments();
        if (pubList.length > 0) {
          this.inviteSelectedCommitmentId.set(pubList[0].id);
        }
      }
    });
  }

  toggleTheme(): void {
    const nextMode = this.themeService.isDark() ? 'light' : 'dark';
    this.themeService.setTheme(nextMode);
  }

  selectCommitment(id: string): void {
    this.selectedCommitmentId.set(id);
    this.isDropdownOpen.set(false);
  }

  getCategoryIcon(category?: string): string {
    switch (category) {
      case 'health':
        return 'heart';
      case 'environment':
        return 'leaf';
      case 'community':
        return 'users';
      case 'growth':
        return 'trending-up';
      default:
        return 'sparkles';
    }
  }

  async shareInviteLink(): Promise<void> {
    const habit = this.selectedCommitment();
    const habitTitle = habit ? habit.title : 'My Daily Habit';
    const shared = await this.chainService.shareInvite(habitTitle);
    if (shared) {
      this.showToast('Invite link shared / copied to clipboard! 🔗✨');
    }
  }

  async copyLinkOnly(): Promise<void> {
    const success = await this.chainService.copyInviteToClipboard(this.currentInviteUrl());
    if (success) {
      this.copied.set(true);
      this.showToast('Invite link copied to clipboard! 📋');
      setTimeout(() => this.copied.set(false), 2500);
    }
  }

  toggleQrModal(open?: boolean): void {
    this.isQrModalOpen.set(open !== undefined ? open : !this.isQrModalOpen());
  }

  // Accept incoming invite and link with local public habit
  acceptIncomingInvite(): void {
    const invite = this.incomingInvite();
    if (!invite) return;

    const myHabitId = this.inviteSelectedCommitmentId();
    const myHabit = this.publicCommitments().find((c) => c.id === myHabitId);

    if (!myHabit) {
      this.showToast('Please select one of your public habits first.');
      return;
    }

    this.chainService.acceptInvite({
      inviterName: invite.inviterName,
      inviterHabitTitle: invite.habitTitle,
      inviterCategory: invite.category,
      myCommitmentId: myHabit.id,
      myCommitmentTitle: myHabit.title,
    });

    this.showToast(`Support chain connected with ${invite.inviterName}! 🎉💙`);
    this.dismissIncomingInvite();
  }

  async createQuickPublicHabitAndLink(): Promise<void> {
    const invite = this.incomingInvite();
    if (!invite) return;

    const newHabit = await this.commitmentService.addCommitment({
      title: `${invite.habitTitle} (Chained with ${invite.inviterName})`,
      category: invite.category || 'growth',
      totalDays: 21,
      isPublic: true,
      why: `Habit journey chained with ${invite.inviterName}`,
    });

    this.chainService.acceptInvite({
      inviterName: invite.inviterName,
      inviterHabitTitle: invite.habitTitle,
      inviterCategory: invite.category,
      myCommitmentId: newHabit.id,
      myCommitmentTitle: newHabit.title,
    });

    this.showToast(`Public habit created and chained with ${invite.inviterName}! 🌟`);
    this.dismissIncomingInvite();
  }

  dismissIncomingInvite(): void {
    this.incomingInvite.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  // Trigger floating heart and send reaction
  triggerHeart(event: MouseEvent, chainId: string, partnerName: string): void {
    this.chainService.sendReaction(chainId, 'heart');

    // Spawn floating heart
    const heartId = Date.now() + Math.random();
    const x = event.clientX || window.innerWidth / 2;
    const y = event.clientY || window.innerHeight / 2;

    this.floatingHearts.update((hearts) => [
      ...hearts,
      { id: heartId, x, y, emoji: '💙' },
    ]);

    setTimeout(() => {
      this.floatingHearts.update((hearts) => hearts.filter((h) => h.id !== heartId));
    }, 1200);

    this.showToast(`Sent love and energy to @${partnerName}! 💙✨`);
  }

  sendReaction(chainId: string, type: 'heart' | 'cheer' | 'nudge'): void {
    this.chainService.sendReaction(chainId, type);
    if (type === 'cheer') {
      this.showToast('Cheered and sent positive energy to your friend! 🌟');
    } else if (type === 'nudge') {
      this.showToast('Gentle reminder sent! 🔔');
    } else {
      this.showToast('Sent heart and positive energy! 💙');
    }
  }

  loadDemoChain(): void {
    this.chainService.addDemoFriendChain();
    this.showToast('Demo friend chain (@sara) loaded! ✨');
  }

  togglePartnerToday(chainId: string): void {
    this.chainService.togglePartnerToday(chainId);
    this.showToast('Partner check-in status toggled (Demo)');
  }

  togglePartnerBroadcastToday(chainId: string): void {
    this.chainService.togglePartnerBroadcastToday(chainId);
    this.showToast('Partner bell broadcast status toggled (Demo)');
  }

  removeChain(chainId: string): void {
    this.chainService.removeChain(chainId);
    this.showToast('Chain disconnected.');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
