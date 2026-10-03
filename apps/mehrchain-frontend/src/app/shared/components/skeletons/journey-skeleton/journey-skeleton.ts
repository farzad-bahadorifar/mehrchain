import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-journey-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-pulse">
      <!-- Stats Grid Skeleton -->
      <div class="grid grid-cols-3 gap-3">
        @for (box of [1, 2, 3]; track $index) {
          <div class="bg-card p-4 rounded-2xl border border-border/50 text-center shadow-soft space-y-2">
            <div class="h-2.5 w-12 mx-auto rounded bg-muted/60"></div>
            <div class="h-6 w-8 mx-auto rounded bg-muted/80"></div>
          </div>
        }
      </div>

      <!-- Heatmap Skeleton -->
      <div class="bg-card rounded-3xl p-5 shadow-soft border border-border/50 space-y-4">
        <div class="h-4 w-28 rounded bg-muted/80"></div>
        <div class="h-28 w-full rounded-2xl bg-muted/30"></div>
      </div>
    </div>
  `,
})
export class JourneySkeletonComponent {}
