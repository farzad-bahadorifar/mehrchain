import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { commonTestProviders } from '../../../testing/test-providers';
import { CommitmentStore } from '../../core/store/commitment.store';
import { Journey } from './journey';

describe('Journey', () => {
  let component: Journey;
  let fixture: ComponentFixture<Journey>;
  let store: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Journey],
      providers: [...commonTestProviders],
    }).compileComponents();

    store = TestBed.inject(CommitmentStore);
    fixture = TestBed.createComponent(Journey);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute active commitments and activities correctly', () => {
    patchState(store, {
      commitments: [
        {
          id: 'c1',
          title: 'Morning Yoga',
          category: 'health',
          totalDays: 21,
          currentDay: 1,
          currentStreak: 1,
          isCompletedToday: true,
          startDate: new Date().toISOString(),
          history: ['2026-10-02'],
        },
      ],
    });

    fixture.detectChanges();
    expect(component.activeCommitmentsCount()).toBe(1);
    expect(component.totalActivities()).toBe(1);
    expect(component.recentActivities().length).toBe(1);
  });

  it('should not render duplicate user profile card in Journey page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.querySelector('.truncate')?.textContent ?? '';
    expect(text).not.toContain('Signed In');
  });

  it('should toggle archived flames section', () => {
    expect(component.showArchived()).toBe(false);
    component.toggleArchived();
    expect(component.showArchived()).toBe(true);
  });
});
