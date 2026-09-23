import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingComponent } from './onboarding';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should prevent proceeding to signup if duration is 0', () => {
    component.step.set(6);
    component.openCustomDuration();
    component.onCustomDurationChange('0');

    expect(component.selectedDuration()).toBe(0);
    component.proceedToSignUp();
    expect(component.step()).toBe(6); // Did not advance
  });

  it('should allow proceeding when custom duration is positive', () => {
    component.step.set(6);
    component.openCustomDuration();
    component.onCustomDurationChange('30');

    expect(component.selectedDuration()).toBe(30);
    expect(component.isCustomDuration()).toBe(true);

    component.proceedToSignUp();
    expect(component.step()).toBe(7); // Advanced to signup
  });

  it('should keep custom mode open when typing multi-digit numbers', () => {
    component.openCustomDuration();
    expect(component.isCustomDuration()).toBe(true);

    // User types '2'
    component.onCustomDurationChange('2');
    expect(component.isCustomDuration()).toBe(true);
    expect(component.selectedDuration()).toBe(2);

    // User types '25'
    component.onCustomDurationChange('25');
    expect(component.isCustomDuration()).toBe(true);
    expect(component.selectedDuration()).toBe(25);
  });
});
