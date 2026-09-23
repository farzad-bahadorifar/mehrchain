import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ChainInvitePayload, ChainService } from '../../core/services/chain.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';
import { MeroComponent } from '../../shared/components/mero/mero';
import { ChainCardComponent } from './components/chain-card/chain-card';
import { InviteSectionComponent } from './components/invite-section/invite-section';

@Component({
  selector: 'app-chain',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    MeroComponent,
    ChainCardComponent,
    InviteSectionComponent,
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

  readonly toastMessage = signal<string | null>(null);

  // Incoming invite link parameters
  readonly incomingInvite = signal<ChainInvitePayload | null>(null);
  readonly inviteSelectedCommitmentId = signal<string>('');

  constructor() {
    const list = this.publicCommitments();
    if (list.length > 0) {
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

    // Mark unread activity as read when visiting chain page
    this.chainService.markAsRead();
  }

  toggleTheme(): void {
    const nextMode = this.themeService.isDark() ? 'light' : 'dark';
    this.themeService.setTheme(nextMode);
  }

  getMyHabitTitle(userCommitmentId: string): string {
    const found = this.commitmentService.commitments().find((c) => c.id === userCommitmentId);
    return found ? found.title : 'My Habit';
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

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
