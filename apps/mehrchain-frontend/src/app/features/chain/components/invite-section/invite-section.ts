import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Commitment } from '@mehrchain/shared-data';
import { ChainService } from '../../../../core/services/chain.service';
import { QrCodeComponent } from '../../../../shared/components/qr-code/qr-code';

@Component({
  selector: 'app-invite-section',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, QrCodeComponent],
  templateUrl: './invite-section.html',
  styleUrls: ['./invite-section.css'],
})
export class InviteSectionComponent {
  public chainService = inject(ChainService);

  readonly commitments = input<Commitment[]>([]);
  readonly notifyToast = output<string>();

  readonly selectedCommitmentId = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);
  readonly isQrModalOpen = signal<boolean>(false);
  readonly copied = signal<boolean>(false);
  readonly isSharing = signal<boolean>(false);

  readonly selectedCommitment = computed(() => {
    const list = this.commitments();
    if (list.length === 0) return null;
    const currentId = this.selectedCommitmentId();
    return list.find((c) => c.id === currentId) || list[0];
  });

  readonly currentInviteUrl = signal('');
  private inviteHabitId = '';
  private inviteExpiresAt = 0;

  private async prepareInvite(): Promise<string> {
    const habit = this.selectedCommitment();
    if (!habit) throw new Error('Select a public habit.');
    if (
      this.inviteHabitId === habit.id &&
      this.inviteExpiresAt > Date.now() &&
      this.currentInviteUrl()
    )
      return this.currentInviteUrl();
    const invite = await this.chainService.createInvite(habit.id);
    if (this.selectedCommitment()?.id !== habit.id)
      throw new Error('Habit selection changed. Please retry.');
    this.inviteHabitId = habit.id;
    this.inviteExpiresAt = new Date(invite.expiresAt).getTime();
    const url = this.chainService.getInviteUrl(invite.inviteCode);
    this.currentInviteUrl.set(url);
    return url;
  }

  selectCommitment(id: string): void {
    this.currentInviteUrl.set('');
    this.isQrModalOpen.set(false);
    this.copied.set(false);
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
    if (this.isSharing()) return;
    this.isSharing.set(true);
    try {
      const url = await this.prepareInvite();
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'MehrChain Invite', text: 'Join my habit chain', url });
        this.notifyToast.emit('Invite shared.');
      } else {
        const copied = await this.chainService.copyInviteToClipboard(url);
        this.notifyToast.emit(copied ? 'Invite copied.' : 'Could not copy. Please retry.');
      }
    } catch {
      this.notifyToast.emit('Could not share the invite. Please retry.');
    } finally {
      this.isSharing.set(false);
    }
  }

  async copyLinkOnly(): Promise<void> {
    if (this.isSharing()) return;
    this.isSharing.set(true);
    try {
      const copied = await this.chainService.copyInviteToClipboard(await this.prepareInvite());
      if (!copied) throw new Error('Clipboard unavailable.');
      this.copied.set(true);
      this.notifyToast.emit('Invite copied.');
      setTimeout(() => this.copied.set(false), 2500);
    } catch {
      this.notifyToast.emit('Could not copy the invite. Please retry.');
    } finally {
      this.isSharing.set(false);
    }
  }

  async toggleQrModal(open?: boolean): Promise<void> {
    if (open === false || (open === undefined && this.isQrModalOpen())) {
      this.isQrModalOpen.set(false);
      return;
    }
    if (this.isSharing()) return;
    this.isSharing.set(true);
    try {
      await this.prepareInvite();
      this.isQrModalOpen.set(true);
    } catch {
      this.notifyToast.emit('Could not create a QR invite. Please retry.');
    } finally {
      this.isSharing.set(false);
    }
  }
}
