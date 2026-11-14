import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ChainInvitePayload, ChainService } from '../../core/services/chain.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { AuthService } from '../../core/services/auth.service';
import { MeroComponent } from '../../shared/components/mero/mero';
import { ChainCardComponent } from './components/chain-card/chain-card';
import { InviteSectionComponent } from './components/invite-section/invite-section';
import { ChainCardSkeletonComponent } from '../../shared/components/skeletons';
import {
  ChainDisconnectReceipt,
  DISCONNECT_REASONS,
  DisconnectChainRequest,
  SYSTEM_DISCONNECT_MESSAGE,
} from '@mehrchain/shared-data';

@Component({
  selector: 'app-chain',
  standalone: true,
  imports: [
    CommonModule,
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly publicCommitments = this.chainService.publicCommitments;
  readonly activeConnections = this.chainService.activeConnections;
  readonly receivedSupport = computed(() =>
    this.publicCommitments()
      .map((habit) => ({ ...habit, count: this.chainService.getReceivedHeartCount(habit.id) }))
      .filter((habit) => habit.count > 0),
  );
  readonly disconnectingIds = signal<ReadonlySet<string>>(new Set());
  readonly actionErrors = signal<Record<string, string>>({});

  // Sort connections: most recently active first
  readonly sortedConnections = computed(() => {
    return [...this.activeConnections()].sort((a, b) => {
      const aTime = new Date(a.lastPartnerActivityAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastPartnerActivityAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  });

  readonly isLinking = signal(false);
  readonly quickWhy = signal('');
  readonly inviteError = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  // View State (T34): Show up (daily completions & support) vs Connect (invites & relationships)
  readonly activeView = signal<'show-up' | 'connect'>('show-up');

  // Incoming invite link parameters
  readonly incomingInvite = signal<ChainInvitePayload | null>(null);
  readonly inviteSelectedCommitmentId = signal<string>('');
  readonly selectedPublicCommitment = computed(() =>
    this.publicCommitments().find((c) => c.id === this.inviteSelectedCommitmentId()),
  );

  constructor() {
    timer(0, 15000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (document.visibilityState === 'visible') void this.chainService.loadConnections();
      });
    const list = this.publicCommitments();
    if (list.length > 0) {
      this.inviteSelectedCommitmentId.set(list[0].id);
    }

    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      const code = params['invite'];
      this.incomingInvite.set(null);
      this.inviteError.set(null);
      this.quickWhy.set('');
      if (!code) return;
      this.activeView.set('connect');
      this.chainService
        .getInvite(code)
        .then((invite) => {
          if (this.route.snapshot.queryParams['invite'] !== code) return;
          this.incomingInvite.set({
            inviteCode: invite.inviteCode,
            inviterName: (invite.sender?.username
              ? invite.sender.username
              : invite.sender?.name || 'Friend').replace(/^@+/, ''),
            habitTitle: invite.senderCommitment?.title || 'Habit',
            category: invite.senderCommitment?.category as any,
          });
          this.inviteSelectedCommitmentId.set(this.publicCommitments()[0]?.id || '');
        })
        .catch(() => this.inviteError.set('This invite is invalid, expired, or already used.'));
    });
    void this.chainService.loadConnections().then(() => this.chainService.markAsRead());
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
      this.showToast(`Chain connected with ${invite.inviterName}!`);
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
        why: this.quickWhy().trim(),
      });
      this.inviteSelectedCommitmentId.set(habit.id);
      await this.chainService.acceptInvite(invite.inviteCode, habit.id);
      this.showToast('Habit created and chain connected!');
      this.quickWhy.set('');
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
    this.actionErrors.update((errors) => ({ ...errors, [connectionId]: '' }));
    try {
      await this.chainService.sendHeart(connectionId);
    } catch {
      this.actionErrors.update((errors) => ({
        ...errors,
        [connectionId]: 'Heart was not saved. Please retry.',
      }));
    }
  }

  receiptReason(receipt: ChainDisconnectReceipt): string {
    return receipt.reason === 'HABIT_UNAVAILABLE'
      ? SYSTEM_DISCONNECT_MESSAGE
      : DISCONNECT_REASONS[receipt.reason];
  }

  async handleDisconnect({
    connectionId,
    request,
  }: {
    connectionId: string;
    request: DisconnectChainRequest;
  }): Promise<void> {
    if (this.disconnectingIds().has(connectionId)) return;
    this.disconnectingIds.update((ids) => new Set([...ids, connectionId]));
    this.actionErrors.update((errors) => ({ ...errors, [connectionId]: '' }));
    try {
      await this.chainService.disconnect(connectionId, request);
      this.showToast('Chain disconnected.');
    } catch {
      this.actionErrors.update((errors) => ({
        ...errors,
        [connectionId]:
          'Could not confirm disconnection. Your reason is kept; retry or refresh if this chain changed.',
      }));
    } finally {
      this.disconnectingIds.update((ids) => {
        const next = new Set(ids);
        next.delete(connectionId);
        return next;
      });
    }
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
