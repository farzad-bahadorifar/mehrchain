import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeatmapCalendar } from '../../shared/components/heatmap-calendar/heatmap-calendar';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivityLog } from '@mehrchain/shared-data';

import { McButtonComponent, McCardComponent } from '../../shared/ui';
import { MeroComponent } from '../../shared/components/mero/mero';

@Component({
  selector: 'app-journey',
  imports: [CommonModule, HeatmapCalendar, LucideAngularModule, McCardComponent, McButtonComponent, MeroComponent],
  templateUrl: './journey.html',
  styleUrl: './journey.css',
})
export class Journey implements OnInit {
  commitmentService = inject(CommitmentService);
  authService = inject(AuthService);

  showArchived = signal(false);

  ngOnInit(): void {
    this.commitmentService.fetchArchivedCommitments();
  }

  toggleArchived(): void {
    this.showArchived.update((v) => !v);
  }

  async restoreHabit(id: string): Promise<void> {
    await this.commitmentService.restoreCommitment(id);
  }

  async permanentDeleteHabit(id: string): Promise<void> {
    if (confirm('Are you sure you want to permanently delete this habit and all its history?')) {
      await this.commitmentService.permanentDeleteCommitment(id);
    }
  }

  currentUser = this.authService.currentUser;

  activeCommitmentsCount = computed(() => this.commitmentService.commitments().length);

  recentActivities = computed(() => {
    const logs: ActivityLog[] = [];
    const commitments = this.commitmentService.commitments();

    commitments.forEach((c) => {
      if (c.history) {
        c.history.forEach((dateStr: string) => {
          logs.push({
            title: c.title,
            date: dateStr,
            icon: this.getCategoryIcon(c.category),
          });
        });
      }
    });
    return logs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  });

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      health: 'heart',
      growth: 'trending-up',
      community: 'users',
      environment: 'leaf',
    };
    return icons[cat] || 'check';
  }

  allHistory = computed(() => {
    const commitments = this.commitmentService.commitments();
    let allDates: string[] = [];

    commitments.forEach((c) => {
      if (c.history && c.history.length > 0) {
        allDates = [...allDates, ...c.history];
      }
    });

    return allDates;
  });

  totalActivities = computed(() => this.allHistory().length);
  longestStreak = this.commitmentService.overallStreak;
}

