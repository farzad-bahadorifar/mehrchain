import { ComponentFixture, TestBed } from '@angular/core/testing';
import { McBadgeComponent } from './badge';

describe('McBadgeComponent (Atomic UI)', () => {
  let component: McBadgeComponent;
  let fixture: ComponentFixture<McBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(McBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create badge with primary variant', () => {
    expect(component).toBeTruthy();
    expect(component.variant()).toBe('primary');
    expect(component.size()).toBe('xs');
  });

  it('should apply neutral variant classes', () => {
    fixture.componentRef.setInput('variant', 'neutral');
    fixture.detectChanges();

    const rootEl = fixture.nativeElement.firstElementChild;
    expect(rootEl.className).toContain('bg-muted');
    expect(rootEl.className).toContain('text-muted-foreground');
  });
});
