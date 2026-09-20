import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-signup-step',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './signup-step.html',
})
export class SignupStepComponent {
  readonly signUpUsername = input.required<string>();
  readonly signUpEmail = input.required<string>();
  readonly signUpPassword = input.required<string>();
  readonly signUpError = input.required<string>();
  readonly isDuplicateEmailError = input.required<boolean>();
  readonly showSignUpPassword = input.required<boolean>();

  readonly usernameChange = output<string>();
  readonly emailChange = output<string>();
  readonly passwordChange = output<string>();
  readonly togglePassword = output<void>();
  readonly signUp = output<void>();
  readonly switchToLogin = output<void>();
  readonly openLoginWithForgot = output<void>();
}
