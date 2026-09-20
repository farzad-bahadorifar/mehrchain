import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MeroComponent } from '../../../shared/components/mero/mero';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [LucideAngularModule, MeroComponent],
  templateUrl: './login-modal.html',
})
export class LoginModalComponent {
  readonly loginEmail = input.required<string>();
  readonly loginPassword = input.required<string>();
  readonly loginError = input.required<string>();
  readonly isNoAccountFound = input.required<boolean>();
  readonly showLoginPassword = input.required<boolean>();
  readonly isPrefilledFromSignUp = input.required<boolean>();
  readonly isForgotPasswordMode = input.required<boolean>();
  readonly forgotPasswordEmail = input.required<string>();
  readonly forgotPasswordSubmitted = input.required<boolean>();

  readonly emailChange = output<string>();
  readonly passwordChange = output<string>();
  readonly togglePassword = output<void>();
  readonly login = output<void>();
  readonly switchToSignUp = output<void>();
  readonly toggleForgotPassword = output<boolean>();
  readonly forgotEmailChange = output<string>();
  readonly forgotPasswordSubmit = output<void>();
  readonly close = output<void>();
}
