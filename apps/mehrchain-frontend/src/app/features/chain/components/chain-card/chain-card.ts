import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  ChainConnection,
  DISCONNECT_NOTE_LIMIT,
  DISCONNECT_REASONS,
  DisconnectChainRequest,
  DisconnectReason,
} from '@mehrchain/shared-data';

export type ChainCardVisualState = 'COMPLETED_TODAY' | 'WAITING' | 'RESTING' | 'JOURNEY_COMPLETED';

@Component({
  selector: 'app-chain-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './chain-card.html',
  styleUrls: ['./chain-card.css'],
})
export class ChainCardComponent {
  readonly connection = input.required<ChainConnection>();
  readonly myHabitTitle = input<string>('My Habit');
  readonly pending = input(false);
  readonly stale = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly heartSend = output<string>();
  readonly disconnect = output<{ connectionId: string; request: DisconnectChainRequest }>();
  readonly isMenuOpen = signal(false);
  readonly isDisconnectOpen = signal(false);
  readonly disconnectReason = signal<DisconnectReason | ''>('');
  readonly disconnectNote = signal('');
  private readonly reasonSelect = viewChild<ElementRef<HTMLSelectElement>>('reasonSelect');
  readonly reasonOptions = Object.entries(DISCONNECT_REASONS).map(([value, label]) => ({
    value,
    label,
  }));
  readonly noteLimit = DISCONNECT_NOTE_LIMIT;
  readonly disconnectPreview = computed(() => {
    const reason = this.disconnectReason();
    return reason ? DISCONNECT_REASONS[reason] : '';
  });

  constructor() {
    // Reused connection rows can belong to a newly accepted chain. Clear any
    // old draft before permitting another confirmation against that generation.
    let generation: string | undefined;
    effect(() => {
      const next = this.connection().generationId;
      if (next === generation) return;
      generation = next;
      untracked(() => {
        this.isDisconnectOpen.set(false);
        this.disconnectReason.set('');
        this.disconnectNote.set('');
      });
    });
    effect(() => {
      this.reasonSelect()?.nativeElement.focus();
    });
  }

  readonly partnerUsername = computed(
    () => (this.connection().partner?.username || '').replace(/^@+/, '') || 'partner',
  );
  readonly partnerDisplayName = computed(
    () => (this.connection().partner?.name || '').replace(/^@+/, '') || this.partnerUsername(),
  );
  readonly partnerHabitTitle = computed(
    () => this.connection().partnerCommitment?.title || 'Daily habit',
  );
  readonly partnerAvatarInitial = computed(() => this.partnerDisplayName()[0].toUpperCase());
  readonly isHeartSent = computed(() => !this.stale() && this.connection().heartSent);
  readonly visualState = computed<ChainCardVisualState>(() => {
    const conn = this.connection();
    if (conn.status === 'COMPLETED') return 'JOURNEY_COMPLETED';
    if (conn.partnerCommitment?.isCompletedToday) return 'COMPLETED_TODAY';
    if (conn.status === 'RESTING' || conn.consecutiveMissedDays === 1) return 'RESTING';
    return 'WAITING';
  });
  readonly stateLabel = computed(() => {
    if (this.stale()) return 'Refresh required';
    switch (this.visualState()) {
      case 'COMPLETED_TODAY':
        return 'Completed today';
      case 'JOURNEY_COMPLETED':
        return 'Goal reached';
      case 'RESTING':
        return 'Resting today';
      default:
        return 'Not completed today';
    }
  });

  sendHeart(): void {
    if (this.pending() || this.stale() || this.isHeartSent()) return;
    this.heartSend.emit(this.connection().id);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    if (this.pending()) return;
    this.cancelDisconnect();
    this.isMenuOpen.set(false);
  }

  handleDisconnect(): void {
    if (this.pending()) return;
    this.isDisconnectOpen.set(true);
  }

  selectReason(value: string): void {
    this.disconnectReason.set(value as DisconnectReason | '');
    if (value === 'PREFER_NOT_TO_SHARE') this.disconnectNote.set('');
  }

  cancelDisconnect(): void {
    if (this.pending()) return;
    this.isDisconnectOpen.set(false);
    this.disconnectReason.set('');
    this.disconnectNote.set('');
  }

  confirmDisconnect(): void {
    const reason = this.disconnectReason();
    const generationId = this.connection().generationId;
    if (this.pending() || !reason || !generationId || this.disconnectNote().length > this.noteLimit)
      return;
    this.disconnect.emit({
      connectionId: this.connection().id,
      request: {
        generationId,
        reason,
        ...(reason !== 'PREFER_NOT_TO_SHARE' && { note: this.disconnectNote().trim() }),
      },
    });
  }
}
