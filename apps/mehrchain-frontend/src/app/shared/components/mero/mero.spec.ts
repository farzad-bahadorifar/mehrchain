import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../../testing/test-providers';
import { MeroComponent } from './mero';

describe('MeroComponent', () => {
  let component: MeroComponent;
  let fixture: ComponentFixture<MeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeroComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(MeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map sizes to appropriate classes', () => {
    fixture.componentRef.setInput('size', 'hero');
    fixture.detectChanges();
    expect(component.sizeClasses()).toContain('w-56');

    fixture.componentRef.setInput('size', 'xs');
    fixture.detectChanges();
    expect(component.sizeClasses()).toBe('w-10 h-10');
  });

  it('should trigger squish effect on click when interactive', () => {
    let tapEmitted = false;
    component.onTap.subscribe(() => {
      tapEmitted = true;
    });

    const event = new MouseEvent('click');
    component.handleClick(event);

    expect(component.isSquished()).toBe(true);
    expect(tapEmitted).toBe(true);
  });

  it('should not squish or emit tap when interactive is false', () => {
    fixture.componentRef.setInput('interactive', false);
    fixture.detectChanges();

    let tapEmitted = false;
    component.onTap.subscribe(() => {
      tapEmitted = true;
    });

    const event = new MouseEvent('click');
    component.handleClick(event);

    expect(component.isSquished()).toBe(false);
    expect(tapEmitted).toBe(false);
  });

  it('should support overriding state via input', () => {
    fixture.componentRef.setInput('state', 'celebrating');
    fixture.detectChanges();
    expect(component.effectiveState()).toBe('celebrating');
  });
});
