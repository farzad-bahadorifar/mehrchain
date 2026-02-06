import { Component, input, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-heatmap-calendar',
  imports: [CommonModule],
  templateUrl: './heatmap-calendar.html',
  styleUrl: './heatmap-calendar.css',
})
export class HeatmapCalendar {
  completedDates = input<string[]>([]);
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  ngAfterViewInit() {
    setTimeout(() => {
      const el = this.scrollContainer.nativeElement;
      el.scrollLeft = el.scrollWidth;
    }, 100);
  }

  calendarData = computed(() => {
    const today = new Date();
    const data = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (52 * 7));
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    let currentDate = new Date(startDate);
    const completedSet = new Set(this.completedDates());

    while (currentDate <= today) {
      const dateStr = currentDate.toDateString();
      const level = completedSet.has(dateStr) ? 4 : 0;

      data.push({
        date: new Date(currentDate),
        level: level,
        title: dateStr
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    return data;
  });

  isToday(date: Date): boolean {
    return date.toDateString() === new Date().toDateString();
  }
}

