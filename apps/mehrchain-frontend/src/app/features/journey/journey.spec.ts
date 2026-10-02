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

  it('should compute 5 initial badges with correct metadata and Lucide icons', () => {
    const badges = component.badges();
    expect(badges.length).toBe(5);

    const badgeIds = badges.map((b) => b.id);
    expect(badgeIds).toEqual([
      'first-spark',
      'chain-starter',
      '7-day-streak',
      '21-day-master',
      'kind-soul',
    ]);

    const badgeIcons = badges.map((b) => b.icon);
    expect(badgeIcons).toEqual(['sparkles', 'link', 'flame', 'trophy', 'heart']);
  });

  it('should unlock First Spark badge when total sparks >= 1', () => {
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

    const firstSpark = component.badges().find((b) => b.id === 'first-spark');
    expect(firstSpark?.isUnlocked).toBe(true);
    expect(firstSpark?.progressText).toBe('Unlocked');
  });

  it('should unlock 7-Day and 21-Day streak badges when streak reaches threshold', () => {
    patchState(store, {
      commitments: [
        {
          id: 'c1',
          title: 'Meditation',
          category: 'growth',
          totalDays: -1,
          currentDay: 25,
          currentStreak: 25,
          isCompletedToday: true,
          startDate: new Date().toISOString(),
          history: [],
        },
      ],
    });

    fixture.detectChanges();

    const streak7 = component.badges().find((b) => b.id === '7-day-streak');
    const streak21 = component.badges().find((b) => b.id === '21-day-master');

    expect(streak7?.isUnlocked).toBe(true);
    expect(streak21?.isUnlocked).toBe(true);
  });

  it('should not render duplicate user profile card in Journey page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.truncate')?.textContent).not.toContain('Signed In');
  });

  it('should toggle archived flames section', () => {
    expect(component.showArchived()).toBe(false);
    component.toggleArchived();
    expect(component.showArchived()).toBe(true);
  });
});
