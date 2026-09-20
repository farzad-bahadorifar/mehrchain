import { Component, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-chains-step',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './chains-step.html',
})
export class ChainsStepComponent {
  readonly next = output<void>();
}
