import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ChainCardSkeletonComponent } from '../../shared/components/skeletons';

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
    ChainCardSkeletonComponent,
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

  readonly isLinking = signal(false);
  readonly inviteError = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  // Incoming invite link parameters
  readonly incomingInvite = signal<ChainInvitePayload | null>(null);
  readonly inviteSelectedCommitmentId = signal<string>('');

  constructor() {
    const list = this.publicCommitments();
    if (list.length > 0) {
      this.inviteSelectedCommitmentId.set(list[0].id);
    }

    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      const code = params['invite'];
      this.incomingInvite.set(null);
      this.inviteError.set(null);
      if (!code) return;
      this.chainService
        .getInvite(code)
        .then((invite) => {
          if (this.route.snapshot.queryParams['invite'] !== code) return;
          this.incomingInvite.set({
            inviteCode: invite.inviteCode,
            inviterName: invite.sender?.username || 'Friend',
            habitTitle: invite.senderCommitment?.title || 'Habit',
            category: invite.senderCommitment?.category as any,
          });
          this.inviteSelectedCommitmentId.set(this.publicCommitments()[0]?.id || '');
        })
        .catch(() => this.inviteError.set('This invite is invalid, expired, or already used.'));
    });
    void this.chainService.loadConnections().then(() => this.chainService.markAsRead());
  }

  toggleTheme(): void {
    const nextMode = this.themeService.isDark() ? 'light' : 'dark';
    this.themeService.setTheme(nextMode);
  }

  getMyHabitTitle(userCommitmentId: string): string {
    const found = this.commitmentService.commitments().find((c) => c.id === userCommitmentId);
    return found ? found.title : 'My Habit';
  }

  async acceptIncomingInvite(): Promise<void> {
    const invite = this.incomingInvite();
    if (!invite || this.isLinking()) return;
    const id = this.inviteSelectedCommitmentId();
    if (!this.publicCommitments().some((c) => c.id === id)) {
      this.showToast('Select one of your public habits first.');
      return;
    }
    this.isLinking.set(true);
    try {
      await this.chainService.acceptInvite(invite.inviteCode, id);
      this.showToast(`Chain connected with @${invite.inviterName}!`);
      this.dismissIncomingInvite();
    } catch {
      this.showToast('Could not connect this chain. Please retry.');
    } finally {
      this.isLinking.set(false);
    }
  }

  async createQuickPublicHabitAndLink(): Promise<void> {
    const invite = this.incomingInvite();
    if (!invite || this.isLinking()) return;
    this.isLinking.set(true);
    try {
      const habit = await this.commitmentService.addCommitment({
        title: invite.habitTitle,
        category: invite.category || 'growth',
        totalDays: 21,
        isPublic: true,
      });
      this.inviteSelectedCommitmentId.set(habit.id);
      await this.chainService.acceptInvite(invite.inviteCode, habit.id);
      this.showToast('Habit created and chain connected!');
      this.dismissIncomingInvite();
    } catch {
      this.showToast('Could not complete the link. If your habit was saved, select it and retry.');
    } finally {
      this.isLinking.set(false);
    }
  }

  dismissIncomingInvite(): void {
    this.incomingInvite.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  async handleHeart(connectionId: string): Promise<void> {
    try {
      await this.chainService.sendHeart(connectionId);
    } catch {
      this.showToast('Heart was not saved. Please retry.');
    }
  }

  async handleNudge(connectionId: string): Promise<void> {
    try {
      await this.chainService.sendNudge(connectionId);
      this.showToast('Gentle reminder sent!');
    } catch {
      this.showToast('Could not send reminder.');
    }
  }

  async handleCongratulate(connectionId: string): Promise<void> {
    try {
      await this.chainService.sendHeart(connectionId);
      this.showToast('Congratulations sent!');
    } catch {
      this.showToast('Could not send congratulations.');
    }
  }

  async handleDisconnect(connectionId: string): Promise<void> {
    try {
      await this.chainService.disconnect(connectionId);
      this.showToast('Chain disconnected.');
    } catch {
      this.showToast('Could not disconnect. Please retry.');
    }
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
