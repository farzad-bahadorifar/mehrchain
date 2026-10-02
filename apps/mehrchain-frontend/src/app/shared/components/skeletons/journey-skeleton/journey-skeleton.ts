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

      <!-- Badges Section Skeleton -->
      <div class="bg-card rounded-3xl p-5 shadow-soft border border-border/50 space-y-4">
        <div class="flex items-center justify-between">
          <div class="h-4 w-32 rounded bg-muted/80"></div>
          <div class="h-4 w-20 rounded-full bg-muted/60"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (b of [1, 2, 3, 4]; track $index) {
            <div class="p-3 rounded-2xl border border-border/40 flex items-center gap-3 bg-muted/20">
              <div class="w-10 h-10 rounded-2xl bg-muted/70 shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-3.5 w-24 rounded bg-muted/80"></div>
                <div class="h-2.5 w-32 rounded bg-muted/50"></div>
              </div>
            </div>
          }
        </div>
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
