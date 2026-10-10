import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  validateCustomDuration,
  handleDurationKeydown,
} from '../../../core/utils/duration-validator';

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
  readonly durationErrorMessage = input<string | null>(null);
  readonly whyText = input.required<string>();
  readonly reminderTime = input.required<string>();
  readonly isPublic = input.required<boolean>();

  readonly standardDurationSelected = output<number>();
  readonly endlessDurationSelected = output<void>();
  readonly openCustom = output<void>();
  readonly customDurationChanged = output<string>();
  readonly whyTextChanged = output<string>();
  readonly reminderTimeChanged = output<string>();
  readonly isPublicChanged = output<boolean>();
  readonly proceedToSignUp = output<void>();

  isDurationValid(): boolean {
    if (!this.isCustomDuration()) {
      return this.selectedDuration() === -1 || this.selectedDuration() > 0;
    }
    return validateCustomDuration(this.customDurationText()).isValid;
  }

  onDurationKeydown(event: KeyboardEvent): void {
    handleDurationKeydown(event, this.customDurationText());
  }
}
