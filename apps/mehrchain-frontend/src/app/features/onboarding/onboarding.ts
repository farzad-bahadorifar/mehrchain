import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Heart,
  Leaf,
  LucideAngularModule,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Bell,
  Clock,
} from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroService } from '../../core/services/mero.service';
import { NotificationService } from '../../core/services/notification.service';

export interface CategoryOption {
  id: 'health' | 'growth' | 'community' | 'environment';
  label: string;
  subtitle: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
}

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class OnboardingComponent implements OnInit {
  private router = inject(Router);
  private commitmentService = inject(CommitmentService);
  public meroService = inject(MeroService);
  private notificationService = inject(NotificationService);

  // Active slide step (0 to 3)
  step = signal<number>(0);

  // First habit initial state
  selectedCategory = signal<'health' | 'growth' | 'community' | 'environment'>('health');
  selectedHabit = signal<string>('Drink a glass of water after waking up');
  selectedDuration = signal<number>(21);
  isCustomDuration = signal(false);
  isCustomHabit = signal(false);
  whyText = signal<string>('To prove to myself that small steps matter and my physical wellbeing comes first.');
  reminderTime = signal<string>('08:30');

  categories: CategoryOption[] = [
    {
      id: 'health',
      label: 'Health & Wellness',
      subtitle: 'Body & mind vitality',
      icon: Heart,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
    {
      id: 'growth',
      label: 'Growth & Wisdom',
      subtitle: 'Daily continuous learning',
      icon: TrendingUp,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      id: 'community',
      label: 'Kindness & Connection',
      subtitle: 'Lighting someone else’s day',
      icon: Users,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
    },
    {
      id: 'environment',
      label: 'Environment & Earth',
      subtitle: 'Mindful living in harmony',
      icon: Leaf,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
  ];

  presetHabits: Record<'health' | 'growth' | 'community' | 'environment', { title: string; why: string }[]> = {
    health: [
      { title: 'Drink a glass of water after waking up', why: 'To hydrate my body and start the day with refreshing energy.' },
      { title: '10 minutes of gentle stretching or walk', why: 'To release muscle tension and keep my body active.' },
      { title: 'Peaceful sleep before midnight', why: 'To properly rest and awaken with natural motivation.' },
    ],
    growth: [
      { title: 'Read 5 to 10 pages of a book', why: 'To nourish my mind and expand my perspective every single day.' },
      { title: 'Write down 3 things I am grateful for', why: 'To train my eyes to see the abundance and beauty around me.' },
      { title: 'Learn one new concept or skill', why: 'To become 1% better than yesterday with zero pressure.' },
    ],
    community: [
      { title: 'Send a heartfelt check-in message to a friend', why: 'To nurture meaningful human connection and warmth.' },
      { title: 'Smile and share positive energy with someone', why: 'To create a subtle positive ripple in my community.' },
      { title: 'Perform one small act of random kindness', why: 'To make the digital and real world a gentler place.' },
    ],
    environment: [
      { title: 'Turn off unnecessary lights and devices', why: 'To conserve precious energy and reduce unnecessary waste.' },
      { title: 'Use a reusable bag or reusable bottle', why: 'To minimize single-use plastics from polluting nature.' },
      { title: 'Care for and water a plant', why: 'To stay connected with nature and practice mindful nurturing.' },
    ],
  };

  ngOnInit() {
    // Returning user check: If the user already has commitments, route directly to dashboard
    if (this.commitmentService.hasAnyCommitment()) {
      this.router.navigate(['/dashboard']);
    }
  }

  nextStep() {
    if (this.step() < 3) {
      this.step.update((v) => v + 1);
      this.updateMeroState();
    }
  }

  prevStep() {
    if (this.step() > 0) {
      this.step.update((v) => v - 1);
      this.updateMeroState();
    }
  }

  goToStep(targetStep: number) {
    this.step.set(targetStep);
    this.updateMeroState();
  }

  private updateMeroState() {
    switch (this.step()) {
      case 0:
        this.meroService.setState('idle');
        break;
      case 1:
        this.meroService.setState('waiting');
        break;
      case 2:
        this.meroService.setState('happy');
        break;
      case 3:
        this.meroService.setState('happy');
        break;
    }
  }

  selectCategory(id: 'health' | 'growth' | 'community' | 'environment') {
    this.selectedCategory.set(id);
    const presets = this.presetHabits[id];
    if (presets && presets.length > 0 && !this.isCustomHabit()) {
      this.selectedHabit.set(presets[0].title);
      this.whyText.set(presets[0].why);
    }
  }

  selectPresetHabit(preset: { title: string; why: string }) {
    this.selectedHabit.set(preset.title);
    this.whyText.set(preset.why);
    this.isCustomHabit.set(false);
  }

  setDuration(days: number) {
    this.selectedDuration.set(days);
    this.isCustomDuration.set(false);
  }

  toggleCustomDuration() {
    this.isCustomDuration.set(true);
  }

  confirmCustomDuration(value: string) {
    const days = parseInt(value, 10);
    if (!isNaN(days) && days > 0) {
      this.selectedDuration.set(days);
      this.isCustomDuration.set(false);
    }
  }

  enableCustomHabit() {
    this.isCustomHabit.set(true);
    this.selectedHabit.set('');
  }

  updateCustomHabit(value: string) {
    this.selectedHabit.set(value);
  }

  updateReminderTime(timeVal: string) {
    if (timeVal) {
      this.reminderTime.set(timeVal);
    }
  }

  async finish() {
    const title = this.selectedHabit().trim();
    if (!title) {
      alert('Please specify a title for your first habit.');
      return;
    }

    // 1. Create first commitment in local store
    const newCommitment = this.commitmentService.addCommitment({
      title: title,
      category: this.selectedCategory(),
      totalDays: this.selectedDuration(),
      why: this.whyText().trim(),
      reminderTime: this.reminderTime(),
    });

    // 2. Schedule daily device reminder based on chosen time
    const [hourStr, minuteStr] = this.reminderTime().split(':');
    const hour = parseInt(hourStr, 10) || 8;
    const minute = parseInt(minuteStr, 10) || 30;

    await this.notificationService.scheduleDailyHabitReminder({
      id: 1001,
      title: 'MehrChain Reminder ✨',
      body: `Time to light your lamp today: ${title}`,
      hour,
      minute,
      commitmentId: newCommitment.id,
    });

    // 3. Trigger celebrating state on Mero and navigate to dashboard
    this.meroService.setState('celebrating');
    this.router.navigate(['/dashboard']);
  }

  openLoginModal() {
    alert('Online cloud sync is coming soon! You can seamlessly start with secure on-device storage.');
  }
}
