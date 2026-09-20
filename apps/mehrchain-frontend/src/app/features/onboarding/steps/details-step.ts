import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-details-step',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './details-step.html',
})
export class DetailsStepComponent {
  readonly selectedDuration = input.required<number>();
  readonly isCustomDuration = input.required<boolean>();
  readonly whyText = input.required<string>();
  readonly reminderTime = input.required<string>();

  readonly durationChanged = output<number>();
  readonly toggleCustomDuration = output<void>();
  readonly whyTextChanged = output<string>();
  readonly reminderTimeChanged = output<string>();
  readonly proceedToSignUp = output<void>();

  /** Helper used in template — mirrors parent's isNonStandardDuration() */
  isNonStandardDuration(): boolean {
    return ![7, 14, 21].includes(this.selectedDuration());
  }
}
