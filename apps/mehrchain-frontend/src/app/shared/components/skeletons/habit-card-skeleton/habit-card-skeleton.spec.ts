import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HabitCardSkeletonComponent } from './habit-card-skeleton';

describe('HabitCardSkeletonComponent', () => {
  let component: HabitCardSkeletonComponent;
  let fixture: ComponentFixture<HabitCardSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitCardSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HabitCardSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render default 2 skeleton cards', () => {
    expect(component).toBeTruthy();
    const cards = fixture.nativeElement.querySelectorAll('.animate-pulse');
    expect(cards.length).toBe(2);
  });
});
