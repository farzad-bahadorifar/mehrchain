import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { ChainService } from '../../core/services/chain.service';
import { MeroService } from '../../core/services/mero.service';
import { MeroCustomizationService } from '../../core/services/mero-customization.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { Commitment } from '@mehrchain/shared-data';
import { CommitmentCardComponent } from '../../shared/components/commitment-card/commitment-card';
import { DeleteConfirmationModal } from '../../shared/components/delete-confirmation-modal/delete-confirmation-modal';
import { EditCommitmentModal } from '../../shared/components/edit-commitment-modal/edit-commitment-modal';
import { NewCommitmentModal } from '../../shared/components/new-commitment-modal/new-commitment-modal';
import { MeroComponent } from '../../shared/components/mero/mero';
import { HabitCardSkeletonComponent } from '../../shared/components/skeletons';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    CommitmentCardComponent,
    LucideAngularModule,
    NewCommitmentModal,
    DeleteConfirmationModal,
    EditCommitmentModal,
    MeroComponent,
    HabitCardSkeletonComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  commitmentService = inject(CommitmentService);
  chainService = inject(ChainService);
  themeService = inject(ThemeService);
  meroService = inject(MeroService);
  customizationService = inject(MeroCustomizationService);
  notificationService = inject(NotificationService);
  router = inject(Router);
  saving = signal(false);
  saveError = signal<string | null>(null);
  isModalOpen = signal(false);
  deletingCommitment = signal<Commitment | null>(null);
  editingCommitment = signal<Commitment | null>(null);
  toastMessage = signal<string | null>(null);

  toggleTheme() {
    const nextMode = this.themeService.isDark() ? 'light' : 'dark';
    this.themeService.setTheme(nextMode);
  }

  openNewCommitment() {
    this.saveError.set(null);
    this.isModalOpen.set(true);
  }

  async handleNewCommitment(data: any) {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const newCommitment = await this.commitmentService.addCommitment(data);
      this.isModalOpen.set(false);
      this.meroService.setState('celebrating');

      // Schedule notification if reminder time exists
      if (data.reminderTime) {
        const [hourStr, minuteStr] = data.reminderTime.split(':');
        const hour = parseInt(hourStr, 10) || 8;
        const minute = parseInt(minuteStr, 10) || 30;

        await this.notificationService
          .scheduleDailyHabitReminder({
            id: Math.floor(Math.random() * 100000) + 1,
            title: 'MehrChain Reminder ✨',
            body: `Time to light your lamp: ${data.title}`,
            hour,
            minute,
            commitmentId: newCommitment.id,
          })
          .catch(() => this.showToast('Habit saved. Reminder could not be scheduled.'));
      }

      setTimeout(() => this.meroService.setState('idle'), 3000);
    } catch (error) {
      this.saveError.set(
        error instanceof Error ? error.message : 'Could not save habit. Try again.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  async handleComplete(id: string) {
    try {
      await this.commitmentService.completeCommitment(id);
      this.meroService.setState('happy');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      setTimeout(() => this.meroService.setState('idle'), 2000);
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : 'Could not save Spark. Try again.');
    }
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
  }

  promptDelete(id: string) {
    const found = this.commitmentService.commitments().find((c) => c.id === id);
    if (found) {
      this.deletingCommitment.set(found);
    }
  }

  cancelDelete() {
    this.deletingCommitment.set(null);
  }

  async confirmDelete() {
    const target = this.deletingCommitment();
    if (target) {
      try {
        await this.commitmentService.removeCommitment(target.id);
        this.deletingCommitment.set(null);
      } catch (error) {
        this.showToast(error instanceof Error ? error.message : 'Could not archive habit.');
      }
    }
  }

  async handleArchive(id: string) {
    try {
      await this.commitmentService.removeCommitment(id);
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : 'Could not archive habit.');
    }
  }

  openEdit(id: string) {
    const found = this.commitmentService.commitments().find((c) => c.id === id);
    if (found) {
      this.saveError.set(null);
      this.editingCommitment.set(found);
    }
  }

  closeEdit() {
    this.editingCommitment.set(null);
  }

  async handleUpdateCommitment(data: any) {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      await this.commitmentService.updateCommitment(data.id, {
        title: data.title,
        why: data.why,
        totalDays: data.totalDays,
        category: data.category,
        reminderTime: data.reminderTime,
        isPublic: data.isPublic,
      });
      this.editingCommitment.set(null);
    } catch (error) {
      this.saveError.set(
        error instanceof Error ? error.message : 'Could not update habit. Try again.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
