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
  readonly customDurationText = input.required<string>();
  readonly whyText = input.required<string>();
  readonly reminderTime = input.required<string>();

  readonly standardDurationSelected = output<number>();
  readonly openCustom = output<void>();
  readonly customDurationChanged = output<string>();
  readonly whyTextChanged = output<string>();
  readonly reminderTimeChanged = output<string>();
  readonly proceedToSignUp = output<void>();

  isDurationValid(): boolean {
    return this.selectedDuration() > 0;
  }
}
