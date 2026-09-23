import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ChainConnection } from '@mehrchain/shared-data';

export type ChainCardVisualState =
  | 'COMPLETED_TODAY'
  | 'WAITING'
  | 'RESTING'
  | 'FADING'
  | 'JOURNEY_COMPLETED';

@Component({
  selector: 'app-chain-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './chain-card.html',
  styleUrls: ['./chain-card.css'],
})
export class ChainCardComponent {
  // Inputs using Angular Signal Inputs
  readonly connection = input.required<ChainConnection>();
  readonly myHabitTitle = input<string>('My Habit');

  // Outputs
  readonly heartToggle = output<string>();
  readonly nudge = output<string>();
  readonly congratulate = output<string>();
  readonly disconnect = output<string>();

  // Local component state
  readonly isMenuOpen = signal<boolean>(false);
  readonly nudgeSent = signal<boolean>(false);
  readonly congratulated = signal<boolean>(false);

  // Computed state
  readonly partnerUsername = computed(() => {
    const conn = this.connection();
    return conn.partner?.username || 'partner';
  });

  readonly partnerDisplayName = computed(() => {
    const conn = this.connection();
    return conn.partner?.name || conn.partner?.username || 'Partner';
  });

  readonly partnerHabitTitle = computed(() => {
    const conn = this.connection();
    return conn.partnerCommitment?.title || 'Daily Habit';
  });

  readonly partnerAvatarInitial = computed(() => {
    const name = this.partnerDisplayName();
    return (name[0] || 'P').toUpperCase();
  });

  readonly isHeartSent = computed(() => {
    return !!this.connection().heartSent;
  });

  readonly visualState = computed<ChainCardVisualState>(() => {
    const conn = this.connection();
    if (conn.status === 'COMPLETED') {
      return 'JOURNEY_COMPLETED';
    }
    if (conn.status === 'FADING' || (conn.consecutiveMissedDays && conn.consecutiveMissedDays >= 2)) {
      return 'FADING';
    }
    if (conn.status === 'RESTING' || conn.consecutiveMissedDays === 1) {
      return 'RESTING';
    }

    const lastCompleted = conn.partnerCommitment?.lastCompletedDate;
    if (lastCompleted) {
      const compDate = new Date(lastCompleted).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      if (compDate === todayStr) {
        return 'COMPLETED_TODAY';
      }
    }

    return 'WAITING';
  });

  toggleHeart(): void {
    this.heartToggle.emit(this.connection().id);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  handleNudge(): void {
    if (this.nudgeSent()) return;
    this.nudge.emit(this.connection().id);
    this.nudgeSent.set(true);
  }

  handleCongratulate(): void {
    if (this.congratulated()) return;
    this.congratulate.emit(this.connection().id);
    this.congratulated.set(true);
  }

  handleDisconnect(): void {
    this.closeMenu();
    this.disconnect.emit(this.connection().id);
  }
}
