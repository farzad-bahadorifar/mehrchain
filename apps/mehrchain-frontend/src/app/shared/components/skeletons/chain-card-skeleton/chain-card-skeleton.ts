import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chain-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-3">
      @for (item of items(); track $index) {
        <div
          class="bg-card rounded-2xl p-4 border border-border/60 shadow-soft animate-pulse space-y-3.5"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1">
              <!-- Partner avatar skeleton -->
              <div class="w-10 h-10 rounded-full bg-muted/80 shrink-0"></div>
              <div class="space-y-1.5 flex-1">
                <div class="h-4 w-28 rounded bg-muted/80"></div>
                <div class="h-3 w-40 rounded bg-muted/50"></div>
              </div>
            </div>
            <!-- Streak pill skeleton -->
            <div class="h-6 w-12 rounded-full bg-muted/60"></div>
          </div>

          <!-- Bottom action row skeleton -->
          <div class="pt-2 border-t border-border/40 flex items-center justify-between">
            <div class="h-3.5 w-32 rounded bg-muted/50"></div>
            <div class="h-8 w-20 rounded-xl bg-muted/70"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ChainCardSkeletonComponent {
  count = input<number>(2);

  get items() {
    return () => Array(this.count()).fill(0);
  }
}
