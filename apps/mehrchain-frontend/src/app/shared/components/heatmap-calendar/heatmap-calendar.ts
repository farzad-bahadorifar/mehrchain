import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  dateKey: string;
}

@Component({
  selector: 'app-heatmap-calendar',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './heatmap-calendar.html',
  styleUrl: './heatmap-calendar.css',
})
export class HeatmapCalendar {
  // Array of completed date strings (either YYYY-MM-DD or toDateString)
  completedDates = input<string[]>([]);

  // Current viewed year and month (0-indexed: 0 = January, 7 = August, etc.)
  viewDate = signal(new Date());

  readonly weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  readonly monthName = computed(() => {
    return this.viewDate().toLocaleString('en-US', { month: 'long' });
  });

  readonly year = computed(() => {
    return this.viewDate().getFullYear();
  });

  readonly isViewingCurrentMonth = computed(() => {
    const now = new Date();
    const current = this.viewDate();
    return now.getFullYear() === current.getFullYear() && now.getMonth() === current.getMonth();
  });

  // Normalized set of completed date keys (YYYY-MM-DD)
  readonly completedSet = computed(() => {
    const set = new Set<string>();
    const dates = this.completedDates();

    for (const d of dates) {
      if (!d) continue;
      // Handle YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        set.add(d);
      } else {
        // Handle Date string (e.g. from toDateString or ISO)
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) {
          const key = this.formatDateKey(parsed);
          set.add(key);
          set.add(parsed.toDateString());
        }
      }
    }
    return set;
  });

  // Days matrix for the 7x5 or 7x6 calendar grid
  readonly monthDays = computed(() => {
    const current = this.viewDate();
    const year = current.getFullYear();
    const month = current.getMonth();

    const today = new Date();
    const todayKey = this.formatDateKey(today);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday-based day of week (0 = Monday, ..., 6 = Sunday)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const days: CalendarDay[] = [];
    const completed = this.completedSet();

    // 1. Previous month leading days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const key = this.formatDateKey(d);
      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isCompleted: completed.has(key) || completed.has(d.toDateString()),
        isFuture: d > today,
        dateKey: key,
      });
    }

    // 2. Current month days
    const totalDaysInMonth = lastDayOfMonth.getDate();
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const key = this.formatDateKey(d);
      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: key === todayKey,
        isCompleted: completed.has(key) || completed.has(d.toDateString()),
        isFuture: d > today,
        dateKey: key,
      });
    }

    // 3. Next month trailing days to complete full grid weeks
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const key = this.formatDateKey(d);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isCompleted: completed.has(key) || completed.has(d.toDateString()),
        isFuture: d > today,
        dateKey: key,
      });
    }

    return days;
  });

  // Total completed days in the viewed month
  readonly monthlyActiveCount = computed(() => {
    return this.monthDays().filter((d) => d.isCurrentMonth && d.isCompleted).length;
  });

  prevMonth(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.viewDate.set(new Date());
  }

  private formatDateKey(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
