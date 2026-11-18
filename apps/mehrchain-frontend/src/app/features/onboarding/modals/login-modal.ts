import { DialogAccessibilityDirective } from '../../../shared/directives/dialog-accessibility.directive';
import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MeroComponent } from '../../../shared/components/mero/mero';
import { PasswordSetupComponent } from '../../../shared/components/password-setup/password-setup';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [
    DialogAccessibilityDirective,
    LucideAngularModule,
    MeroComponent,
    PasswordSetupComponent,
  ],
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
  readonly isLoggingIn = input<boolean>(false);
  readonly allowDemoMode = input<boolean>(false);

  readonly emailChange = output<string>();
  readonly passwordChange = output<string>();
  readonly togglePassword = output<void>();
  readonly login = output<void>();
  readonly googleLogin = output<void>();
  readonly devLogin = output<void>();
  readonly switchToSignUp = output<void>();
  readonly toggleForgotPassword = output<boolean>();
  readonly close = output<void>();
}
