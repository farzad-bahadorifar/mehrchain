import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Plus, Flame, Sparkles, CheckCircle2, Heart } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroService } from '../../core/services/mero.service';
import { NotificationService } from '../../core/services/notification.service';
import { CommitmentCardComponent } from '../../shared/components/commitment-card/commitment-card';
import { NewCommitmentModal } from '../../shared/components/new-commitment-modal/new-commitment-modal';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CommitmentCardComponent, LucideAngularModule, NewCommitmentModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  commitmentService = inject(CommitmentService);
  meroService = inject(MeroService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  isModalOpen = signal(false);

  // Mero's contextual dialog messages based on current mood
  get meroMessage(): string {
    const state = this.meroService.state();
    switch (state) {
      case 'celebrating':
        return 'Wonderful! Your light shone brightly today 🌟';
      case 'happy':
        return 'Proud of your consistency! Small steps build our world ✨';
      case 'waiting':
        return 'Looking forward to lighting your lamp today 🌱';
      default:
        return 'Hello friend! Ready to ignite today’s spark? 🙂';
    }
  }

  openNewCommitment() {
    this.isModalOpen.set(true);
  }

  async handleNewCommitment(data: any) {
    const newCommitment = this.commitmentService.addCommitment(data);
    this.isModalOpen.set(false);
    this.meroService.setState('celebrating');

    // Schedule local notification for new habit
    if (data.reminderTime) {
      const [hourStr, minuteStr] = data.reminderTime.split(':');
      const hour = parseInt(hourStr, 10) || 8;
      const minute = parseInt(minuteStr, 10) || 30;

      await this.notificationService.scheduleDailyHabitReminder({
        id: Math.floor(Math.random() * 100000) + 1,
        title: 'MehrChain Reminder ✨',
        body: `Time to light your lamp: ${data.title}`,
        hour,
        minute,
        commitmentId: newCommitment.id,
      });
    }

    setTimeout(() => this.meroService.setState('idle'), 3500);
  }

  handleComplete(id: string) {
    this.commitmentService.completeCommitment(id);
    this.meroService.setState('celebrating');

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }

    setTimeout(() => this.meroService.setState('happy'), 3000);
  }
}
