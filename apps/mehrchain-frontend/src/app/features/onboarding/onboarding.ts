import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Heart,
  Leaf,
  LucideAngularModule,
  TrendingUp,
  Users,
  ArrowRight,
  Plus,
  Sparkles,
  Bell,
  Clock,
  Lock,
  Mail,
  User,
  X,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroService } from '../../core/services/mero.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class OnboardingComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
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
  step = signal<number>(0);

  // Habit Form State
  selectedCategory = signal<string | null>(null);
  selectedHabit = signal<string | null>(null);
  selectedDuration = signal<number>(21);
  isCustomDuration = signal(false);
  isCustomHabit = signal(false);
  whyText = signal('To prove to myself that small steps matter.');
  reminderTime = signal('08:30');

  // Sign Up Form State (Step 6)
  signUpName = signal('');
  signUpEmail = signal('');
  signUpPassword = signal('');
  signUpError = signal('');

  // Login Modal State
  isLoginModalOpen = signal(false);
  loginEmail = signal('');
  loginPassword = signal('');
  loginError = signal('');

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
      color: 'text-teal-600',
      bg: 'bg-teal-100 border-teal-200',
    },
    {
      id: 'growth',
      label: 'Growth',
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

  ngOnInit() {
    // Returning authenticated user check
    if (this.authService.isAuthenticated() && this.commitmentService.hasAnyCommitment()) {
      this.router.navigate(['/dashboard']);
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

  selectCategory(id: string) {
    this.selectedCategory.set(id);
    this.meroService.setState('happy');
    setTimeout(() => this.nextStep(), 350);
  }

  selectHabit(title: string) {
    this.selectedHabit.set(title);
    this.nextStep();
  }

  setDuration(days: number) {
    this.selectedDuration.set(days);
    this.isCustomDuration.set(false);
  }

  toggleCustomDuration() {
    this.isCustomDuration.set(true);
  }

  onCustomDurationInput(value: string) {
    const days = parseInt(value, 10);
    if (days > 0) {
      this.selectedDuration.set(days);
    }
  }

  isNonStandardDuration(): boolean {
    return ![7, 14, 21].includes(this.selectedDuration());
  }

  enableCustomHabit() {
    this.isCustomHabit.set(true);
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

  proceedToSignUp() {
    this.step.set(7);
  }

  async handleSignUp() {
    this.signUpError.set('');

    const name = this.signUpName().trim();
    const email = this.signUpEmail().trim();
    const password = this.signUpPassword().trim();

    if (!name || name.length < 2) {
      this.signUpError.set('Please enter your full name.');
      return;
    }

    if (!email || !email.includes('@')) {
      this.signUpError.set('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      this.signUpError.set('Password must be at least 6 characters.');
      return;
    }

    // Register user profile
    await this.authService.register(name, email, password);

    // Save habit commitment
    if (this.selectedHabit() && this.selectedCategory()) {
      const newCommitment = await this.commitmentService.addCommitment({
        title: this.selectedHabit()!,
        category: this.selectedCategory() as any,
        totalDays: this.selectedDuration(),
        why: this.whyText(),
        reminderTime: this.reminderTime(),
      });

      // Schedule local notification if reminderTime is set
      if (this.reminderTime()) {
        const [hourStr, minuteStr] = this.reminderTime().split(':');
        const hour = parseInt(hourStr, 10) || 8;
        const minute = parseInt(minuteStr, 10) || 30;

        await this.notificationService.scheduleDailyHabitReminder({
          id: 1001,
          title: 'MehrChain Reminder ✨',
          body: `Time to light your lamp: ${this.selectedHabit()}`,
          hour,
          minute,
          commitmentId: newCommitment.id,
        });
      }
    }

    this.meroService.setState('celebrating');
    this.router.navigate(['/dashboard']);
  }

  openLoginModal() {
    this.loginError.set('');
    this.isLoginModalOpen.set(true);
  }

  closeLoginModal() {
    this.isLoginModalOpen.set(false);
  }

  async handleLogin() {
    this.loginError.set('');
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

    await this.authService.login(email, password);
    this.isLoginModalOpen.set(false);

    // If user has commitments, take them to dashboard, else guide to pick a habit
    if (this.commitmentService.hasAnyCommitment()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.step.set(4); // Go to category selection
    }
  }
}
