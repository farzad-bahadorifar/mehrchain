import { Component, computed, inject } from '@angular/core';
import { HeatmapCalendar } from '../../shared/components/heatmap-calendar/heatmap-calendar';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { ActivityLog } from '@mehrchain/shared-data';

@Component({
  selector: 'app-journey',
  imports: [HeatmapCalendar, LucideAngularModule],
  templateUrl: './journey.html',
  styleUrl: './journey.css',
})
export class Journey {
  commitmentService = inject(CommitmentService);

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
    const icons: any = {
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
