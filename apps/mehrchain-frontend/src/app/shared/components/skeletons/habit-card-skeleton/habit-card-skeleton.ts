import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-habit-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      @for (item of items(); track $index) {
        <div
          class="bg-card rounded-3xl p-5 border border-border/50 shadow-soft animate-pulse space-y-4"
        >
          <!-- Header skeleton -->
          <div class="flex justify-between items-start">
            <div class="space-y-2 flex-1">
              <div class="flex items-center gap-2">
                <div class="h-4 w-14 rounded-full bg-muted/80"></div>
                <div class="h-4 w-16 rounded-full bg-muted/60"></div>
              </div>
              <div class="h-5 w-40 rounded-lg bg-muted/80"></div>
            </div>
            <div class="w-6 h-6 rounded-full bg-muted/60"></div>
          </div>

          <!-- Why skeleton -->
          <div class="h-8 w-full rounded-xl bg-muted/40"></div>

          <!-- Progress info skeleton -->
          <div class="flex justify-between items-center">
            <div class="h-3 w-24 rounded bg-muted/60"></div>
            <div class="h-3 w-20 rounded bg-muted/60"></div>
          </div>

          <!-- Progress bar skeleton -->
          <div class="h-2 w-full rounded-full bg-muted/50"></div>

          <!-- Weekly dots skeleton -->
          <div class="flex justify-between items-center px-1">
            @for (dot of [1, 2, 3, 4, 5, 6, 7]; track $index) {
              <div class="w-2.5 h-2.5 rounded-full bg-muted/60"></div>
            }
          </div>

          <!-- Spark button skeleton -->
          <div class="h-11 w-full rounded-2xl bg-muted/70"></div>
        </div>
      }
    </div>
  `,
})
export class HabitCardSkeletonComponent {
  count = input<number>(2);

  get items() {
    return () => Array(this.count()).fill(0);
  }
}
