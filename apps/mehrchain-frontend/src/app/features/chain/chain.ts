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
import { ChainCardComponent } from './components/chain-card/chain-card';

@Component({
  selector: 'app-chain',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    QrCodeComponent,
    MeroComponent,
    ChainCardComponent,
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
  readonly activeConnections = this.chainService.activeConnections;

  // Sort connections: most recently active first
  readonly sortedConnections = computed(() => {
    return [...this.activeConnections()].sort((a, b) => {
      const aTime = new Date(a.lastPartnerActivityAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastPartnerActivityAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  });

  readonly selectedCommitmentId = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);
  readonly isQrModalOpen = signal<boolean>(false);
  readonly copied = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);

  // Incoming invite link parameters
  readonly incomingInvite = signal<ChainInvitePayload | null>(null);
  readonly inviteSelectedCommitmentId = signal<string>('');

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

  getMyHabitTitle(userCommitmentId: string): string {
    const found = this.commitmentService.commitments().find((c) => c.id === userCommitmentId);
    return found ? found.title : 'My Habit';
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
      this.showToast('Invite link shared / copied to clipboard!');
    }
  }

  async copyLinkOnly(): Promise<void> {
    const success = await this.chainService.copyInviteToClipboard(this.currentInviteUrl());
    if (success) {
      this.copied.set(true);
      this.showToast('Invite link copied to clipboard!');
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

    this.showToast(`Support chain connected with @${invite.inviterName}!`);
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

    this.showToast(`Public habit created and chained with @${invite.inviterName}!`);
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

  handleHeart(connectionId: string): void {
    this.chainService.sendHeart(connectionId);
  }

  async handleNudge(connectionId: string): Promise<void> {
    try {
      await this.chainService.sendNudge(connectionId);
      this.showToast('Gentle reminder sent!');
    } catch {
      this.showToast('Could not send reminder.');
    }
  }

  handleCongratulate(connectionId: string): void {
    this.chainService.sendHeart(connectionId);
    this.showToast('Congratulations sent!');
  }

  handleDisconnect(connectionId: string): void {
    this.chainService.disconnect(connectionId);
    this.showToast('Chain disconnected.');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
