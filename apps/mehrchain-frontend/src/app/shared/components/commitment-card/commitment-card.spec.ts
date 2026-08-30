import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../../testing/test-providers';
import { CommitmentCardComponent } from './commitment-card';

describe('CommitmentCard', () => {
  let component: CommitmentCardComponent;
  let fixture: ComponentFixture<CommitmentCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommitmentCardComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(CommitmentCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('commitment', {
      id: 'comm-1',
      title: 'Morning Yoga',
      category: 'health',
      totalDays: 21,
      currentDay: 1,
      currentStreak: 0,
      isCompletedToday: false,
      startDate: new Date().toISOString(),
      history: [],
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
