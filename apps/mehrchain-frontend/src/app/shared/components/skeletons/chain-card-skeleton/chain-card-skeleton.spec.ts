import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChainCardSkeletonComponent } from './chain-card-skeleton';

describe('ChainCardSkeletonComponent', () => {
  let component: ChainCardSkeletonComponent;
  let fixture: ComponentFixture<ChainCardSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChainCardSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChainCardSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render default 2 chain skeleton cards', () => {
    expect(component).toBeTruthy();
    const cards = fixture.nativeElement.querySelectorAll('.animate-pulse');
    expect(cards.length).toBe(2);
  });
});
