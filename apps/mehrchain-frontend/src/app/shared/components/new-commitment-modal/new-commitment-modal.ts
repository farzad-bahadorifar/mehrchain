import { Component, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Heart, Leaf, Users, TrendingUp, X, Sparkles, Plus, Clock, Bell } from 'lucide-angular';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-new-commitment-modal',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './new-commitment-modal.html',
  styleUrl: './new-commitment-modal.css',
})
export class NewCommitmentModal {
  close = output<void>();
  submit = output<any>();
  notificationService = inject(NotificationService);

  isCustomDuration = signal(false);

  title = signal('');
  why = signal('');
  duration = signal(21);
  category = signal<'health' | 'growth' | 'community' | 'environment'>('health');
  reminderTime = signal('08:30');

  categories: Array<{ id: 'health' | 'growth' | 'community' | 'environment'; icon: string; label: string }> = [
    { id: 'health', icon: 'heart', label: 'Health' },
    { id: 'growth', icon: 'trending-up', label: 'Growth' },
    { id: 'community', icon: 'users', label: 'Community' },
    { id: 'environment', icon: 'leaf', label: 'Nature' },
  ];

  setCategory(catId: 'health' | 'growth' | 'community' | 'environment') {
    this.category.set(catId);
  }

  get suggestions() {
    const cat = this.category();
    switch (cat) {
      case 'health':
        return ['Morning water', 'Quick stretch', 'Sleep before midnight'];
      case 'growth':
        return ['Read 10 pages', 'Daily journal', 'Learn 1 new word'];
      case 'community':
        return ['Call family', 'Share a smile', 'Small act of kindness'];
      case 'environment':
        return ['Save electricity', 'Reduce plastic', 'Water a plant'];
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

  async handleSubmit() {
    const titleVal = this.title().trim();
    if (titleVal.length < 2) return;

    this.submit.emit({
      title: titleVal,
      why: this.why().trim(),
      totalDays: this.duration(),
      category: this.category(),
      reminderTime: this.reminderTime(),
    });

    this.close.emit();
  }
}
