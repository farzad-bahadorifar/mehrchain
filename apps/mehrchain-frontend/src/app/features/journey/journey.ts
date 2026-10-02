import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeatmapCalendar } from '../../shared/components/heatmap-calendar/heatmap-calendar';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { ChainService } from '../../core/services/chain.service';
import { ActivityLog } from '@mehrchain/shared-data';

import { McButtonComponent, McCardComponent } from '../../shared/ui';
import { MeroComponent } from '../../shared/components/mero/mero';
import { JourneySkeletonComponent } from '../../shared/components/skeletons';

export interface JourneyBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progressText: string;
}

@Component({
  selector: 'app-journey',
  imports: [
    CommonModule,
    HeatmapCalendar,
    LucideAngularModule,
    McCardComponent,
    McButtonComponent,
    MeroComponent,
    JourneySkeletonComponent,
  ],
  templateUrl: './journey.html',
  styleUrl: './journey.css',
})
export class Journey implements OnInit {
  commitmentService = inject(CommitmentService);
  chainService = inject(ChainService);

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

  // 5 Initial Badges (Lucide icons only)
  badges = computed<JourneyBadge[]>(() => {
    const totalSparks = this.totalActivities();
    const streak = this.longestStreak();
    const connections = this.chainService.connections();
    const hasPublicOrChain =
      connections.length > 0 || this.commitmentService.commitments().some((c) => c.isPublic);
    const hasHeartReaction = connections.some(
      (c) => c.heartSent === true || (c.lastPartnerActivityAt && c.status === 'ACTIVE')
    );

    return [
      {
        id: 'first-spark',
        name: 'First Spark',
        description: 'Complete your first habit ever',
        icon: 'sparkles',
        isUnlocked: totalSparks >= 1,
        progressText: totalSparks >= 1 ? 'Unlocked' : `${totalSparks} / 1 spark`,
      },
      {
        id: 'chain-starter',
        name: 'Chain Starter',
        description: 'Form your first chain connection',
        icon: 'link',
        isUnlocked: hasPublicOrChain,
        progressText: hasPublicOrChain ? 'Unlocked' : 'Create public habit or invite',
      },
      {
        id: '7-day-streak',
        name: '7-Day Streak',
        description: 'Keep a flame burning for 7 days',
        icon: 'flame',
        isUnlocked: streak >= 7,
        progressText: streak >= 7 ? 'Unlocked' : `${streak} / 7 days`,
      },
      {
        id: '21-day-master',
        name: '21-Day Master',
        description: '21 days streak (unlocks custom glow)',
        icon: 'trophy',
        isUnlocked: streak >= 21,
        progressText: streak >= 21 ? 'Unlocked' : `${streak} / 21 days`,
      },
      {
        id: 'kind-soul',
        name: 'Kind Soul',
        description: 'Support a friend along the chain',
        icon: 'heart',
        isUnlocked: hasHeartReaction || connections.length > 0,
        progressText: hasHeartReaction || connections.length > 0 ? 'Unlocked' : 'Support partner',
      },
    ];
  });

  unlockedBadgesCount = computed(() => this.badges().filter((b) => b.isUnlocked).length);
}

