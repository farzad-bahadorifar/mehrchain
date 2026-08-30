import { CommonModule } from '@angular/common';
import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Commitment } from '@mehrchain/shared-data';
import { McButtonComponent } from '../../ui';

@Component({
  selector: 'app-edit-commitment-modal',
  imports: [CommonModule, FormsModule, LucideAngularModule, McButtonComponent],
  templateUrl: './edit-commitment-modal.html',
})
export class EditCommitmentModal {
  commitment = input.required<Commitment>();

  close = output<void>();
  save = output<{
    id: string;
    title: string;
    why: string;
    totalDays: number;
    category: any;
    reminderTime?: string;
  }>();

  title = signal('');
  why = signal('');
  duration = signal(21);
  category = signal('health');
  reminderTime = signal('08:30');
  isCustomDuration = signal(false);

  categories = [
    { id: 'health', icon: 'heart', label: 'Health' },
    { id: 'environment', icon: 'leaf', label: 'Nature' },
    { id: 'community', icon: 'users', label: 'Community' },
    { id: 'growth', icon: 'trending-up', label: 'Growth' },
  ];

  constructor() {
    effect(() => {
      const c = this.commitment();
      if (c) {
        this.title.set(c.title);
        this.why.set(c.why || '');
        this.duration.set(c.totalDays);
        this.category.set(c.category);
        this.reminderTime.set(c.reminderTime || '08:30');
        if (![7, 21, 30].includes(c.totalDays)) {
          this.isCustomDuration.set(true);
        }
      }
    });
  }

  setStandardDuration(days: number) {
    this.duration.set(days);
    this.isCustomDuration.set(false);
  }

  toggleCustomDuration() {
    this.isCustomDuration.set(true);
  }

  onCustomDurationInput(val: string) {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      this.duration.set(num);
      this.isCustomDuration.set(true);
    }
  }

  onSubmit() {
    if (!this.title().trim()) return;

    this.save.emit({
      id: this.commitment().id,
      title: this.title().trim(),
      why: this.why().trim(),
      totalDays: this.duration(),
      category: this.category(),
      reminderTime: this.reminderTime(),
    });
  }
}
