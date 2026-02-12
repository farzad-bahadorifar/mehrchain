import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Commitment } from '../../../core/models/commitment.model';

@Component({
  selector: 'app-commitment-card',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './commitment-card.html',
  styleUrl: './commitment-card.css',
})
export class CommitmentCardComponent {
  commitment = input.required<Commitment>();

  onComplete = output<number>();

  get progressPercent() {
    return Math.round((this.commitment().currentDay / this.commitment().totalDays) * 100);
  }

  get weekDots() {
    const current = this.commitment().currentDay;
    const completed = this.commitment().isCompletedToday;
    return Array(7)
      .fill(0)
      .map((_, i) => {
        const dayIndex = i + 1;
        if (dayIndex < current % 7 || (dayIndex === current % 7 && completed)) return 'filled';
        if (dayIndex === current % 7 && !completed) return 'current';
        return 'empty';
      });
  }
}
