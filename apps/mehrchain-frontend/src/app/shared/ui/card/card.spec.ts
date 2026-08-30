import { ComponentFixture, TestBed } from '@angular/core/testing';
import { McCardComponent } from './card';

describe('McCardComponent (Atomic UI)', () => {
  let component: McCardComponent;
  let fixture: ComponentFixture<McCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(McCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create card with default elevated variant', () => {
    expect(component).toBeTruthy();
    expect(component.variant()).toBe('elevated');
    expect(component.padding()).toBe('md');
  });

  it('should apply correct classes for flat variant', () => {
    fixture.componentRef.setInput('variant', 'flat');
    fixture.detectChanges();

    const rootEl = fixture.nativeElement.firstElementChild;
    expect(rootEl.className).toContain('bg-muted/40');
  });
});
