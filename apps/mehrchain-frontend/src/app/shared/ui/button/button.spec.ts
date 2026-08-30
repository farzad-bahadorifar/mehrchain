import { ComponentFixture, TestBed } from '@angular/core/testing';
import { McButtonComponent } from './button';

describe('McButtonComponent (Atomic UI)', () => {
  let component: McButtonComponent;
  let fixture: ComponentFixture<McButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(McButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the button with default props', () => {
    expect(component).toBeTruthy();
    expect(component.variant()).toBe('primary');
    expect(component.size()).toBe('md');
  });

  it('should emit clicked event when active and clicked', () => {
    const emitSpy = vi.fn();
    component.clicked.subscribe(emitSpy);

    const buttonEl = fixture.nativeElement.querySelector('button');
    buttonEl.click();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit clicked event when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const emitSpy = vi.fn();
    component.clicked.subscribe(emitSpy);

    const buttonEl = fixture.nativeElement.querySelector('button');
    buttonEl.click();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(buttonEl.disabled).toBe(true);
  });
});
