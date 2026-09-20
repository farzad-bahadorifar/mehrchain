import { Component, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-why-choose-step',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './why-choose-step.html',
})
export class WhyChooseStepComponent {
  readonly next = output<void>();
}
