import { Component, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-welcome-step',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './welcome-step.html',
})
export class WelcomeStepComponent {
  readonly next = output<void>();
  readonly openLogin = output<void>();
}
