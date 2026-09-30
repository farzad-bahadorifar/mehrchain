import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/services/auth.service';
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

  it('should initialize isHabitPublic as true and allow toggling', () => {
    expect(component.isHabitPublic()).toBe(true);
    component.isHabitPublic.set(false);
    expect(component.isHabitPublic()).toBe(false);
  });

  it('should auto-fill verificationCode when register returns previewCode', async () => {
    const authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'register').mockResolvedValue({
      requiresVerification: true,
      email: 'test@example.com',
      username: 'testuser',
      message: 'Code sent',
      previewCode: '555444',
    });

    component.signUpUsername.set('testuser');
    component.signUpEmail.set('test@example.com');
    component.signUpPassword.set('password123');

    await component.handleSignUp();

    expect(component.isVerificationModalOpen()).toBe(true);
    expect(component.previewOtpCode()).toBe('555444');
    expect(component.verificationCode()).toBe('555444');
  });

  it('should auto-fill verificationCode when resendVerificationCode returns previewCode', async () => {
    const authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'resendVerificationCode').mockResolvedValue({
      success: true,
      message: 'Code resent',
      previewCode: '777888',
    });

    component.signUpEmail.set('test@example.com');
    await component.handleResendVerificationCode();

    expect(component.previewOtpCode()).toBe('777888');
    expect(component.verificationCode()).toBe('777888');
  });
});
