import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-habit-step',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './habit-step.html',
})
export class HabitStepComponent {
  readonly selectedCategory = input.required<string>();
  readonly habits = input.required<Record<string, string[]>>();
  readonly isCustomHabit = input.required<boolean>();

  readonly habitSelected = output<string>();
  readonly enableCustom = output<void>();
  readonly cancelCustom = output<void>();
  readonly confirmCustom = output<string>();
}
