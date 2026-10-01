import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MeroComponent } from '../../../shared/components/mero/mero';

@Component({
  selector: 'app-verification-modal',
  standalone: true,
  imports: [LucideAngularModule, MeroComponent],
  templateUrl: './verification-modal.html',
})
export class VerificationModalComponent {
  readonly signUpEmail = input.required<string>();
  readonly verificationCode = input.required<string>();
  readonly verificationError = input.required<string>();
  readonly verificationSuccess = input.required<string>();
  readonly isVerifying = input.required<boolean>();
  readonly isResending = input.required<boolean>();
  readonly resendCooldown = input.required<number>();
  readonly previewCode = input<string>('');
  readonly isNetworkError = input<boolean>(false);
  readonly isDemoMode = input<boolean>(false);

  readonly codeChange = output<string>();
  readonly autoFill = output<string>();
  readonly verify = output<void>();
  readonly resend = output<void>();
  readonly useDemoMode = output<void>();
  readonly close = output<void>();
}
