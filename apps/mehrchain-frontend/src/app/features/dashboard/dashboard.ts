import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroService } from '../../core/services/mero.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
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
  themeService = inject(ThemeService);
  meroService = inject(MeroService);
  notificationService = inject(NotificationService);
  router = inject(Router);
  isModalOpen = signal(false);

  toggleTheme() {
    const nextMode = this.themeService.isDark() ? 'light' : 'dark';
    this.themeService.setTheme(nextMode);
  }

  constructor() {
    effect(() => {
      console.log('Dashboard Commitments:', this.commitmentService.commitments());
    });
  }

  openNewCommitment() {
    this.isModalOpen.set(true);
  }

  async handleNewCommitment(data: any) {
    const newCommitment = await this.commitmentService.addCommitment(data);
    this.isModalOpen.set(false);
    this.meroService.setState('celebrating');

    // Schedule notification if reminder time exists
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

    setTimeout(() => this.meroService.setState('idle'), 3000);
  }

  handleComplete(id: string) {
    this.commitmentService.completeCommitment(id);
    this.meroService.setState('happy');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setTimeout(() => this.meroService.setState('idle'), 2000);
  }
}
