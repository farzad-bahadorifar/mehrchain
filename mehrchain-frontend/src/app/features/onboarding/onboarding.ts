import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Heart, Leaf, LucideAngularModule, TrendingUp, Users } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroService } from '../../core/services/mero.service';

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class OnboardingComponent {
  private router = inject(Router);
  private commitmentService = inject(CommitmentService);
  public meroService = inject(MeroService);
  isCustomDuration = signal(false);
  isCustomHabit = signal(false);
  whyText = signal('To prove to myself that small steps matter.');

  step = signal<number>(0);
  selectedCategory = signal<string | null>(null);
  selectedHabit = signal<string | null>(null);
  selectedDuration = signal<number>(21);

  categories = [
    { id: 'health', label: 'Health', icon: Heart, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { id: 'environment', label: 'Environment', icon: Leaf, color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
    { id: 'community', label: 'Community', icon: Users, color: 'text-teal-600', bg: 'bg-teal-100 border-teal-200' },
    { id: 'growth', label: 'Growth', icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-100 border-cyan-200' }
  ];

  habitsMock: Record<string, string[]> = {
    'health': ['Drink water after waking up', '5 mins stretching', 'No sugar today'],
    'environment': ['Pick up one piece of trash', 'Use reusable bag', 'Turn off extra lights'],
    'community': ['Call a family member', 'Smile at a stranger', 'Donate small amount'],
    'growth': ['Read 10 pages', 'Write daily journal', 'Learn one new word']
  };


  nextStep() {
    this.step.update(v => v + 1);
    this.meroService.setState('waiting');
  }

  selectCategory(id: string) {
    this.selectedCategory.set(id);
    this.meroService.setState('happy');
    setTimeout(() => this.nextStep(), 500);
  }

  selectHabit(title: string) {
    this.selectedHabit.set(title);
    this.nextStep();
  }

  setDuration(days: number) {
    this.selectedDuration.set(days);
  }

  toggleCustomDuration() {
    this.isCustomDuration.set(true);
  }

  confirmCustomDuration(value: string) {
    const days = parseInt(value);
    if (days > 0) {
      this.selectedDuration.set(days);
      this.isCustomDuration.set(false);
    }
  }

  finish() {
    if (this.selectedHabit() && this.selectedCategory()) {
      this.commitmentService.addCommitment({
        title: this.selectedHabit()!,
        category: this.selectedCategory() as any,
        totalDays: this.selectedDuration(),

        why: this.whyText()
      });

      this.meroService.setState('celebrating');
      this.router.navigate(['/dashboard']);
    }
  }

  login() {
    alert("Login feature coming soon! For now, just start as a guest.");
  }

  enableCustomHabit() {
    this.isCustomHabit.set(true);
  }

  confirmCustomHabit(value: string) {
    if (value.trim()) {
      this.selectHabit(value);
    }
  }
}