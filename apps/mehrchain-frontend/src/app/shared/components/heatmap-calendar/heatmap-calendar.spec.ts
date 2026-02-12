import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeatmapCalendar } from './heatmap-calendar';

describe('HeatmapCalendar', () => {
  let component: HeatmapCalendar;
  let fixture: ComponentFixture<HeatmapCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatmapCalendar],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatmapCalendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
