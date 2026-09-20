import { Component, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-meaning-step',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './meaning-step.html',
})
export class MeaningStepComponent {
  readonly next = output<void>();
}
