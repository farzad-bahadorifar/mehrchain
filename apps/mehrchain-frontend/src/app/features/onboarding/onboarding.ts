import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Heart, Leaf, LucideAngularModule, TrendingUp, Users } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroService } from '../../core/services/mero.service';
import { NotificationService } from '../../core/services/notification.service';
import { MeroComponent } from '../../shared/components/mero/mero';
import { SwipeDirective } from '../../shared/directives/swipe.directive';
import { WelcomeStepComponent } from './steps/welcome-step';
import { WhyChooseStepComponent } from './steps/why-choose-step';
import { MeaningStepComponent } from './steps/meaning-step';
import { ChainsStepComponent } from './steps/chains-step';
import { CategoryStepComponent } from './steps/category-step';
import { HabitStepComponent } from './steps/habit-step';
import { DetailsStepComponent } from './steps/details-step';
import { SignupStepComponent } from './steps/signup-step';
import { LoginModalComponent } from './modals/login-modal';
import { VerificationModalComponent } from './modals/verification-modal';

@Component({
  selector: 'app-onboarding',
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MeroComponent,
    SwipeDirective,
    WelcomeStepComponent,
    WhyChooseStepComponent,
    MeaningStepComponent,
    ChainsStepComponent,
    CategoryStepComponent,
    HabitStepComponent,
    DetailsStepComponent,
    SignupStepComponent,
    LoginModalComponent,
    VerificationModalComponent,
  ],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class OnboardingComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private googleAuthService = inject(GoogleAuthService);
  private commitmentService = inject(CommitmentService);
  public meroService = inject(MeroService);
  private notificationService = inject(NotificationService);

  // Steps:
  // 0: Welcome
  // 1: Why Choose Us
  // 2: Meaning of MehrChain
  // 3: Select Category
  // 4: Pick Habit Spark
  // 5: Duration, Why & Reminder
  // 6: Create Profile & Sign Up
  readonly sessionError = this.authService.sessionError;
  readonly allowDemoMode = !environment.production;
  step = signal<number>(0);

  // Habit Form State
  selectedCategory = signal<string | null>(null);
  selectedHabit = signal<string | null>(null);
  selectedDuration = signal<number>(-1);
  isCustomDuration = signal(false);
  customDurationText = signal<string>('');
  isCustomHabit = signal(false);
  whyText = signal('To prove to myself that small steps matter.');
  reminderTime = signal('08:30');
  isHabitPublic = signal(true);

  // Sign Up Form State (Step 6/7)
  signUpUsername = signal('');
  signUpName = signal('');
  signUpEmail = signal('');
  signUpPassword = signal('');
  signUpError = signal('');
  isDuplicateEmailError = signal(false);
  isNetworkSignUpError = signal(false);
  showSignUpPassword = signal(false);
  isSigningUp = signal(false);

  // Email Verification Modal State
  isVerificationModalOpen = signal(false);
  verificationCode = signal('');
  previewOtpCode = signal('');
  verificationError = signal('');
  verificationSuccess = signal('');
  isNetworkVerifyError = signal(false);
  isDemoModeActive = signal(false);
  isVerifying = signal(false);
  isResending = signal(false);
  resendCooldown = signal(0);
  private resendTimerInterval: any = null;

  // Login Modal State
  isLoginModalOpen = signal(false);
  loginEmail = signal('');
  loginPassword = signal('');
  loginError = signal('');
  isNoAccountFound = signal(false);
  showLoginPassword = signal(false);
  isPrefilledFromSignUp = signal(false);
  isLoggingIn = signal(false);

  // Forgot Password State
  isForgotPasswordMode = signal(false);
  forgotPasswordEmail = signal('');
  forgotPasswordSubmitted = signal(false);
  isResettingPassword = signal(false);

  toggleSignUpPassword() {
    this.showSignUpPassword.update((v) => !v);
  }

  toggleLoginPassword() {
    this.showLoginPassword.update((v) => !v);
  }

  categories = [
    {
      id: 'health',
      label: 'Health',
      icon: Heart,
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/20',
    },
    {
      id: 'environment',
      label: 'Environment',
      icon: Leaf,
      color: 'text-accent',
      bg: 'bg-accent/10 border-accent/20',
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 border-emerald-200',
    },
    {
      id: 'growth',
      label: 'Personal Growth',
      icon: TrendingUp,
      color: 'text-cyan-600',
      bg: 'bg-cyan-100 border-cyan-200',
    },
  ];

  habitsMock: Record<string, string[]> = {
    health: ['Drink water after waking up', '5 mins stretching', 'No sugar today'],
    environment: ['Pick up one piece of trash', 'Use reusable bag', 'Turn off extra lights'],
    community: ['Call a family member', 'Smile at a stranger', 'Donate small amount'],
    growth: ['Read 10 pages', 'Write daily journal', 'Learn one new word'],
  };

  async ngOnInit() {
    await this.authService.ready;
    // Returning authenticated user check
    if (this.authService.isAuthenticated()) {
      this.authService.navigateAfterLogin();
    }
  }

  nextStep() {
    this.step.update((v) => v + 1);
    this.meroService.setState('waiting');
  }

  prevStep() {
    if (this.step() > 0) {
      this.step.update((v) => v - 1);
      this.meroService.setState('waiting');
    }
  }

  onSwipeRight() {
    if (this.isLoginModalOpen()) return;
    this.prevStep();
  }

  onSwipeLeft() {
    if (this.isLoginModalOpen()) return;
    // Validate whether user can progress forward
    if (this.step() < 4) {
      this.nextStep();
    } else if (this.step() === 4 && this.selectedCategory()) {
      this.nextStep();
    } else if (this.step() === 5 && this.selectedHabit()) {
      this.nextStep();
    } else if (this.step() === 6) {
      this.proceedToSignUp();
    }
  }

  selectCategory(id: string) {
    this.selectedCategory.set(id);
    this.meroService.setState('happy');
    setTimeout(() => this.nextStep(), 350);
  }

  selectHabit(title: string) {
    this.selectedHabit.set(title);
    this.nextStep();
  }

  selectEndlessDuration() {
    this.selectedDuration.set(-1);
    this.isCustomDuration.set(false);
    this.customDurationText.set('');
  }

  selectStandardDuration(days: number) {
    this.selectedDuration.set(days);
    this.isCustomDuration.set(false);
    this.customDurationText.set('');
  }

  openCustomDuration() {
    this.isCustomDuration.set(true);
    const cur = this.selectedDuration();
    if (cur > 0) {
      this.customDurationText.set(cur.toString());
    } else {
      this.customDurationText.set('');
      this.selectedDuration.set(0);
    }
  }

  onCustomDurationChange(val: string) {
    this.customDurationText.set(val);
    const num = parseInt(val.trim(), 10);
    if (!isNaN(num) && num > 0) {
      this.selectedDuration.set(num);
    } else {
      this.selectedDuration.set(0);
    }
  }

  enableCustomHabit() {
    this.isCustomHabit.set(true);
  }

  cancelCustomHabit() {
    this.isCustomHabit.set(false);
  }

  confirmCustomHabit(value: string) {
    if (value && value.trim().length > 0) {
      this.selectedHabit.set(value.trim());
      this.isCustomHabit.set(false);
      this.nextStep();
    }
  }

  updateReminderTime(time: string) {
    if (time) {
      this.reminderTime.set(time);
    }
  }

  skipToMain() {
    this.step.set(6);
  }

  proceedToSignUp() {
    if (this.selectedDuration() !== -1 && this.selectedDuration() <= 0) return;
    this.step.set(7);
  }

  onSignUpUsernameChange(value: string) {
    const clean = value.replace(/^@/, '').toLowerCase().trim();
    this.signUpUsername.set(clean);
    this.signUpError.set('');
    this.isNetworkSignUpError.set(false);
  }

  onSignUpEmailChange(value: string) {
    this.signUpEmail.set(value);
    this.isNetworkSignUpError.set(false);
    if (this.isDuplicateEmailError()) {
      this.isDuplicateEmailError.set(false);
      this.signUpError.set('');
    }
  }

  async handleSignUp() {
    if (this.isSigningUp()) return;

    this.signUpError.set('');
    this.isDuplicateEmailError.set(false);
    this.isNetworkSignUpError.set(false);
    this.isDemoModeActive.set(false);

    const username = this.signUpUsername().trim().toLowerCase();
    const email = this.signUpEmail().trim();
    const password = this.signUpPassword().trim();

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!username || !usernameRegex.test(username)) {
      this.signUpError.set('Username must be 3-20 characters (letters, numbers, underscore).');
      return;
    }

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!email || !emailRegex.test(email)) {
      this.signUpError.set('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      this.signUpError.set('Password must be at least 6 characters.');
      return;
    }

    this.isSigningUp.set(true);

    try {
      const res = await this.authService.register(username, email, password);
      if (res.requiresVerification) {
        const previewCode = this.allowDemoMode ? res.previewCode || '' : '';
        this.previewOtpCode.set(previewCode);
        this.verificationCode.set(previewCode);
        this.verificationError.set('');
        this.verificationSuccess.set('');
        this.isNetworkVerifyError.set(false);
        this.isVerificationModalOpen.set(true);
        this.startResendTimer();
        return;
      }
    } catch (err: any) {
      if (this.authService.isNetworkError(err)) {
        this.isNetworkSignUpError.set(true);
        this.signUpError.set(
          'Unable to connect to the server. Please check your network connection or VPN.',
        );
        return;
      }

      const msg = (err?.message || '').toLowerCase();
      if (
        msg.includes('already exists') ||
        msg.includes('already registered') ||
        msg.includes('conflict') ||
        msg.includes('duplicate')
      ) {
        if (msg.includes('username')) {
          this.signUpError.set('This username is already taken. Please pick another.');
        } else {
          this.isDuplicateEmailError.set(true);
          this.signUpError.set('This email is already registered.');
        }
      } else {
        this.signUpError.set(err?.message || 'Registration failed. Please check your details.');
      }
      return;
    } finally {
      this.isSigningUp.set(false);
    }
  }

  handleUseDemoMode() {
    const username = this.signUpUsername().trim().toLowerCase() || 'demo_user';
    const email = this.signUpEmail().trim().toLowerCase() || 'demo@example.com';
    const res = this.authService.registerOffline(username, email);
    this.isDemoModeActive.set(true);
    this.isNetworkSignUpError.set(false);
    this.signUpError.set('');
    this.previewOtpCode.set(res.previewCode || '123456');
    this.verificationCode.set(res.previewCode || '123456');
    this.verificationError.set('');
    this.verificationSuccess.set('');
    this.isNetworkVerifyError.set(false);
    this.isVerificationModalOpen.set(true);
    this.startResendTimer();
  }

  startResendTimer() {
    this.resendCooldown.set(60);
    if (this.resendTimerInterval) {
      clearInterval(this.resendTimerInterval);
    }
    this.resendTimerInterval = setInterval(() => {
      if (this.resendCooldown() > 0) {
        this.resendCooldown.update((c) => c - 1);
      } else {
        clearInterval(this.resendTimerInterval);
      }
    }, 1000);
  }

  autoFillVerificationCode(code: string) {
    if (code) {
      this.verificationCode.set(code);
      this.handleVerifyEmail();
    }
  }

  async handleVerifyEmail() {
    if (this.isVerifying()) return;
    this.verificationError.set('');
    this.verificationSuccess.set('');
    this.isNetworkVerifyError.set(false);
    const code = this.verificationCode().trim();

    if (!code || code.length !== 6) {
      this.verificationError.set('Please enter the 6-digit verification code.');
      return;
    }

    this.isVerifying.set(true);
    try {
      if (!this.authService.isAuthenticated()) {
        if (this.isDemoModeActive()) this.authService.verifyEmailOffline(this.signUpEmail(), code);
        else await this.authService.verifyEmail(this.signUpEmail(), code);
      }
      this.verificationSuccess.set('Account verified successfully!');

      // Save habit commitment
      if (this.selectedHabit() && this.selectedCategory()) {
        const newCommitment = await this.commitmentService.addCommitment({
          title: this.selectedHabit()!,
          category: this.selectedCategory() as any,
          totalDays: this.selectedDuration(),
          why: this.whyText(),
          reminderTime: this.reminderTime(),
          isPublic: this.isHabitPublic(),
        });

        // Schedule local notification if reminderTime is set
        if (this.reminderTime()) {
          const [hourStr, minuteStr] = this.reminderTime().split(':');
          const hour = parseInt(hourStr, 10) || 8;
          const minute = parseInt(minuteStr, 10) || 30;

          await this.notificationService
            .scheduleDailyHabitReminder({
              id: 1001,
              title: 'MehrChain Reminder ✨',
              body: `Time to light your lamp: ${this.selectedHabit()}`,
              hour,
              minute,
              commitmentId: newCommitment.id,
            })
            .catch(() => {
              /* A notification failure must not invalidate the saved habit. */
            });
        }
      }

      this.meroService.setState('celebrating');
      this.isVerificationModalOpen.set(false);
      this.authService.navigateAfterLogin();
    } catch (err: any) {
      if (this.authService.isNetworkError(err)) {
        this.isNetworkVerifyError.set(true);
        this.verificationError.set('Connection lost. Please retry.');
      } else {
        this.verificationError.set(err?.message || 'Invalid or expired verification code.');
      }
    } finally {
      this.isVerifying.set(false);
    }
  }

  async handleUseDemoModeInVerification() {
    this.isDemoModeActive.set(true);
    this.isNetworkVerifyError.set(false);
    this.verificationCode.set('123456');
    this.previewOtpCode.set('123456');
    this.authService.registerOffline(
      this.signUpUsername() || 'demo_user',
      this.signUpEmail() || 'demo@example.com',
    );
    await this.handleVerifyEmail();
  }

  async handleResendVerificationCode() {
    if (this.resendCooldown() > 0 || this.isResending()) return;
    this.isResending.set(true);
    this.verificationError.set('');
    this.verificationSuccess.set('');
    this.isNetworkVerifyError.set(false);

    try {
      if (this.isDemoModeActive()) {
        this.previewOtpCode.set('123456');
        this.verificationCode.set('123456');
        this.verificationSuccess.set('Demo Mode: Verification code 123456 auto-filled.');
      } else {
        const res = await this.authService.resendVerificationCode(this.signUpEmail());
        if (res.previewCode) {
          this.previewOtpCode.set(res.previewCode);
          this.verificationCode.set(res.previewCode);
        }
        this.verificationSuccess.set('A new verification code has been sent to your email.');
      }
      this.startResendTimer();
    } catch (err: any) {
      if (this.authService.isNetworkError(err)) {
        this.isNetworkVerifyError.set(true);
        this.verificationError.set('Unable to reach server. Please retry or use Demo Mode.');
      } else {
        this.verificationError.set(err?.message || 'Failed to resend code.');
      }
    } finally {
      this.isResending.set(false);
    }
  }

  closeVerificationModal() {
    this.isVerificationModalOpen.set(false);
  }

  openLoginModal(prefillEmail?: string) {
    this.loginError.set('');
    this.isNoAccountFound.set(false);
    this.isForgotPasswordMode.set(false);
    this.forgotPasswordSubmitted.set(false);

    const emailToUse = prefillEmail !== undefined ? prefillEmail : this.signUpEmail().trim();
    if (emailToUse) {
      this.loginEmail.set(emailToUse);
      this.isPrefilledFromSignUp.set(true);
    } else {
      this.isPrefilledFromSignUp.set(false);
    }

    this.isLoginModalOpen.set(true);
  }

  switchToLoginWithEmail() {
    this.openLoginModal(this.signUpEmail().trim());
  }

  switchToSignUpFromLogin() {
    const email = this.loginEmail().trim();
    if (email) {
      this.signUpEmail.set(email);
    }
    this.closeLoginModal();
    // If user hasn't chosen habit yet, guide them to category selection or directly to sign up
    if (!this.selectedHabit() || !this.selectedCategory()) {
      this.step.set(4);
    } else {
      this.step.set(7);
    }
  }

  closeLoginModal() {
    this.isLoginModalOpen.set(false);
    this.isNoAccountFound.set(false);
    this.isForgotPasswordMode.set(false);
    this.forgotPasswordSubmitted.set(false);
  }

  toggleForgotPassword(show: boolean) {
    this.isForgotPasswordMode.set(show);
    this.loginError.set('');
    this.isNoAccountFound.set(false);
    this.forgotPasswordSubmitted.set(false);
    if (show) {
      this.forgotPasswordEmail.set(this.loginEmail().trim() || this.signUpEmail().trim());
    }
  }

  handleForgotPassword() {
    if (this.isResettingPassword()) return;

    const email = this.forgotPasswordEmail().trim();
    if (!email || !email.includes('@')) {
      this.loginError.set('Please enter a valid email address.');
      return;
    }
    this.loginError.set('');
    this.isResettingPassword.set(true);

    try {
      this.forgotPasswordSubmitted.set(true);
    } finally {
      this.isResettingPassword.set(false);
    }
  }

  async handleLogin() {
    if (this.isLoggingIn()) return;

    this.loginError.set('');
    this.isNoAccountFound.set(false);
    const email = this.loginEmail().trim();
    const password = this.loginPassword().trim();

    if (!email || !email.includes('@')) {
      this.loginError.set('Please enter your valid email.');
      return;
    }

    if (!password) {
      this.loginError.set('Please enter your password.');
      return;
    }

    this.isLoggingIn.set(true);

    try {
      await this.authService.login(email, password);
      this.isLoginModalOpen.set(false);
      this.authService.navigateAfterLogin();
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password. Please try again.';
      const lowerMsg = msg.toLowerCase();
      if (
        lowerMsg.includes('no account found') ||
        lowerMsg.includes('user account not found') ||
        lowerMsg.includes('not found') ||
        lowerMsg.includes('please sign up')
      ) {
        this.isNoAccountFound.set(true);
        this.loginError.set('No account found with this email.');
      } else {
        this.loginError.set(msg);
      }
    } finally {
      this.isLoggingIn.set(false);
    }
  }

  async handleGoogleSignIn() {
    this.signUpError.set('');
    this.isSigningUp.set(true);
    try {
      const user = await this.googleAuthService.signInWithGoogle();
      if (user) {
        // Save habit commitment if selected
        if (this.selectedHabit() && this.selectedCategory()) {
          await this.commitmentService.addCommitment({
            title: this.selectedHabit()!,
            category: this.selectedCategory() as any,
            totalDays: this.selectedDuration(),
            why: this.whyText(),
            reminderTime: this.reminderTime(),
            isPublic: this.isHabitPublic(),
          });
        }
        this.meroService.setState('celebrating');
        this.authService.navigateAfterLogin();
      }
    } catch (err: any) {
      this.signUpError.set(err?.message || 'Google sign-in failed.');
    } finally {
      this.isSigningUp.set(false);
    }
  }

  async handleGoogleLogin() {
    this.loginError.set('');
    this.isLoggingIn.set(true);
    try {
      const user = await this.googleAuthService.signInWithGoogle();
      if (user) {
        this.isLoginModalOpen.set(false);
        this.meroService.setState('celebrating');
        this.authService.navigateAfterLogin();
      }
    } catch (err: any) {
      this.loginError.set(err?.message || 'Google sign-in failed.');
    } finally {
      this.isLoggingIn.set(false);
    }
  }
}
