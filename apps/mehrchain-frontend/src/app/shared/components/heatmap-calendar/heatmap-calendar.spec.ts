import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeatmapCalendar } from './heatmap-calendar';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('HeatmapCalendar (Monthly Grid)', () => {
  let component: HeatmapCalendar;
  let fixture: ComponentFixture<HeatmapCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatmapCalendar],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatmapCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display current month and year', () => {
    expect(component).toBeTruthy();
    expect(component.monthName()).toBeTruthy();
    expect(component.year()).toBeGreaterThan(2020);
    expect(component.monthDays().length).toBeGreaterThanOrEqual(28);
  });

  it('should navigate to previous and next month', () => {
    const initialMonth = component.viewDate().getMonth();

    component.prevMonth();
    fixture.detectChanges();
    expect(component.viewDate().getMonth()).toBe((initialMonth - 1 + 12) % 12);

    component.nextMonth();
    fixture.detectChanges();
    expect(component.viewDate().getMonth()).toBe(initialMonth);
  });

  it('should correctly mark completed dates in the grid', () => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    fixture.componentRef.setInput('completedDates', [todayKey]);
    fixture.detectChanges();

    expect(component.monthlyActiveCount()).toBe(1);
  });
});
