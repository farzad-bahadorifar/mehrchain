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

  readonly selectedCommitment = computed(() => {
    const list = this.commitments();
    if (list.length === 0) return null;
    const currentId = this.selectedCommitmentId();
    return list.find((c) => c.id === currentId) || list[0];
  });

  readonly currentInviteUrl = computed(() => {
    const commitment = this.selectedCommitment();
    return this.chainService.getInviteUrl(commitment ? commitment.id : undefined);
  });

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
      this.notifyToast.emit('Invite link shared / copied to clipboard!');
    }
  }

  async copyLinkOnly(): Promise<void> {
    const success = await this.chainService.copyInviteToClipboard(this.currentInviteUrl());
    if (success) {
      this.copied.set(true);
      this.notifyToast.emit('Invite link copied to clipboard!');
      setTimeout(() => this.copied.set(false), 2500);
    }
  }

  toggleQrModal(open?: boolean): void {
    this.isQrModalOpen.set(open !== undefined ? open : !this.isQrModalOpen());
  }
}
