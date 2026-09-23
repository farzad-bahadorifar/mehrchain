import { Component, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

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
  duration = signal(21);
  category = signal('health');
  isPublic = signal(false);
  reminderTime = signal('08:30');

  isDurationValid = computed(() => this.duration() > 0);
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

  setStandardDuration(days: number) {
    this.duration.set(days);
    this.isCustomDuration.set(false);
    this.customDurationText.set('');
  }

  toggleCustomDuration() {
    this.isCustomDuration.set(true);
    const cur = this.duration();
    const initialText = cur > 0 && ![7, 14, 21].includes(cur) ? cur.toString() : '';
    this.customDurationText.set(initialText);
    if (!initialText) {
      this.duration.set(0);
    }
  }

  onCustomDurationInput(value: string) {
    this.customDurationText.set(value);
    const num = parseInt(value.trim(), 10);
    if (!isNaN(num) && num > 0) {
      this.duration.set(num);
    } else {
      this.duration.set(0);
    }
  }

  handleSubmit() {
    if (!this.isValid()) return;

    this.submit.emit({
      title: this.title().trim(),
      why: this.why().trim(),
      totalDays: this.duration(),
      category: this.category(),
      reminderTime: this.reminderTime(),
      isPublic: this.isPublic(),
    });

    this.close.emit();
  }
}
