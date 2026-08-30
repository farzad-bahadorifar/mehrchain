import { Component, output, signal } from '@angular/core';
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

  title = signal('');
  why = signal('');
  duration = signal(21);
  category = signal('health');
  isPublic = signal(false);
  reminderTime = signal('08:30');

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

  toggleCustomDuration() {
    this.isCustomDuration.set(true);
  }

  confirmCustomDuration(value: string) {
    const days = parseInt(value, 10);
    if (days > 0) {
      this.duration.set(days);
      this.isCustomDuration.set(false);
    }
  }

  handleSubmit() {
    if (this.title().trim().length < 2) return;

    this.submit.emit({
      title: this.title().trim(),
      why: this.why().trim(),
      totalDays: this.duration(),
      category: this.category(),
      reminderTime: this.reminderTime(),
    });

    this.close.emit();
  }
}
