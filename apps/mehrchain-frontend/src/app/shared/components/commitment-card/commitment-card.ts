import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LucideAngularModule, Heart, TrendingUp, Users, Leaf, Sparkles, Check, Bell, Clock, CheckCircle2 } from 'lucide-angular';
import { Commitment } from '@mehrchain/shared-data';

@Component({
  selector: 'app-commitment-card',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './commitment-card.html',
  styleUrl: './commitment-card.css',
})
export class CommitmentCardComponent {
  commitment = input.required<Commitment>();
  onComplete = output<string>();

  get categoryInfo() {
    switch (this.commitment().category) {
      case 'health':
        return { label: 'Health', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'growth':
        return { label: 'Growth', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'community':
        return { label: 'Community', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'environment':
        return { label: 'Environment', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Daily Habit', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  }

  get progressPercent() {
    const total = this.commitment().totalDays || 21;
    const current = this.commitment().currentDay || 1;
    return Math.min(100, Math.round((current / total) * 100));
  }

  get weekDots() {
    const current = this.commitment().currentDay;
    const completed = this.commitment().isCompletedToday;
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return Array(7)
      .fill(0)
      .map((_, i) => {
        const dayIndex = i + 1;
        const dayName = dayNames[i];
        let state = 'empty';
        if (dayIndex < current % 7 || (dayIndex === current % 7 && completed)) {
          state = 'filled';
        } else if (dayIndex === current % 7 && !completed) {
          state = 'current';
        }
        return { dayName, state };
      });
  }
}
