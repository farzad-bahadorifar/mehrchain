import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  validateCustomDuration,
  handleDurationKeydown,
} from '../../../core/utils/duration-validator';

@Component({
  selector: 'app-new-commitment-modal',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './new-commitment-modal.html',
  styleUrl: './new-commitment-modal.css',
})
export class NewCommitmentModal {
  close = output<void>();
  submit = output<any>();
  isCustomDuration = signal(false);
  customDurationText = signal('');

  title = signal('');
  why = signal('');
  duration = signal(-1);
  category = signal('health');
  isPublic = signal(false);
  reminderTime = signal('08:30');

  isDurationValid = computed(() => {
    if (!this.isCustomDuration()) {
      return this.duration() === -1;
    }
    return validateCustomDuration(this.customDurationText()).isValid;
  });
  durationErrorMessage = computed(() => {
    if (!this.isCustomDuration()) return null;
    return validateCustomDuration(this.customDurationText()).errorMessage;
  });
  isValid = computed(() => this.title().trim().length >= 2 && this.isDurationValid());

  categories = [
    { id: 'health', icon: 'heart', label: 'Health' },
    { id: 'environment', icon: 'leaf', label: 'Nature' },
    { id: 'community', icon: 'users', label: 'Community' },
    { id: 'growth', icon: 'trending-up', label: 'Growth' },
  ];

  get suggestions() {
    const cat = this.category();
    switch (cat) {
      case 'health':
        return ['Drink Water', 'No Sugar', 'Morning Walk'];
      case 'environment':
        return ['No Plastic', 'Save Water', 'Recycle'];
      case 'community':
        return ['Call Mom', 'Smile more', 'Donate'];
      case 'growth':
        return ['Read 5 pages', 'Journaling', 'Learn new word'];
      default:
        return [];
    }
  }

  selectSuggestion(text: string) {
    this.title.set(text);
  }

  setEndlessDuration() {
    this.duration.set(-1);
    this.isCustomDuration.set(false);
    this.customDurationText.set('');
  }

  toggleCustomDuration() {
    this.isCustomDuration.set(true);
    const cur = this.duration();
    if (cur > 0) {
      this.customDurationText.set(cur.toString());
    } else {
      this.customDurationText.set('');
      this.duration.set(0);
    }
  }

  onCustomDurationInput(value: string) {
    this.customDurationText.set(value);
    const result = validateCustomDuration(value);
    this.duration.set(result.duration);
  }

  onCustomDurationKeydown(event: KeyboardEvent) {
    handleDurationKeydown(event, this.customDurationText());
  }

  isSubmitting = input(false);
  errorMessage = input<string | null>(null);

  handleSubmit() {
    if (this.isSubmitting() || !this.isValid()) return;

    this.submit.emit({
      title: this.title().trim(),
      why: this.why().trim(),
      totalDays: this.duration(),
      category: this.category(),
      reminderTime: this.reminderTime(),
      isPublic: this.isPublic(),
    });
  }
}
