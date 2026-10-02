import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JourneySkeletonComponent } from './journey-skeleton';

describe('JourneySkeletonComponent', () => {
  let component: JourneySkeletonComponent;
  let fixture: ComponentFixture<JourneySkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneySkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JourneySkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render skeleton layout', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.animate-pulse')).toBeTruthy();
  });
});
