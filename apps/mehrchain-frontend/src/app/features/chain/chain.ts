import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ChainService } from '../../core/services/chain.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { ThemeService } from '../../core/services/theme.service';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';
import { QrCodeComponent } from '../../shared/components/qr-code/qr-code';
import { MeroComponent } from '../../shared/components/mero/mero';

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
  public themeService = inject(ThemeService);
  public customizationService = inject(MeroCustomizationService);

  readonly publicCommitments = this.chainService.publicCommitments;
  readonly friendChains = this.chainService.friendChains;

  readonly selectedCommitmentId = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);
  readonly copied = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);

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
    }
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
      this.showToast('Invite link shared / copied to clipboard!');
    }
  }

  async copyLinkOnly(): Promise<void> {
    const success = await this.chainService.copyInviteToClipboard(this.currentInviteUrl());
    if (success) {
      this.copied.set(true);
      this.showToast('Link copied to clipboard! 📋');
      setTimeout(() => this.copied.set(false), 2500);
    }
  }

  sendReaction(chainId: string, type: 'heart' | 'nudge'): void {
    this.chainService.sendReaction(chainId, type);
    this.showToast(type === 'heart' ? 'Heart reaction sent to friend! 💙' : 'Gentle nudge sent to friend! 🔔');
  }

  loadDemoChain(): void {
    this.chainService.addDemoFriendChain();
    this.showToast('Demo friend chain (@sara) loaded! ✨');
  }

  togglePartnerToday(chainId: string): void {
    this.chainService.togglePartnerToday(chainId);
    this.showToast('Friend check-in status updated!');
  }

  removeChain(chainId: string): void {
    this.chainService.removeChain(chainId);
    this.showToast('Chain disconnected.');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }
}
