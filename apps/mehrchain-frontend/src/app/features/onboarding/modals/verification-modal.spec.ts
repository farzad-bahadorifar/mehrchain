import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerificationModalComponent } from './verification-modal';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('VerificationModalComponent', () => {
  let component: VerificationModalComponent;
  let fixture: ComponentFixture<VerificationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationModalComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(VerificationModalComponent);
    component = fixture.componentInstance;
  });

  it('should render auto-fill notification when previewCode is provided', () => {
    fixture.componentRef.setInput('signUpEmail', 'test@example.com');
    fixture.componentRef.setInput('verificationCode', '654321');
    fixture.componentRef.setInput('verificationError', '');
    fixture.componentRef.setInput('verificationSuccess', '');
    fixture.componentRef.setInput('isVerifying', false);
    fixture.componentRef.setInput('isResending', false);
    fixture.componentRef.setInput('resendCooldown', 0);
    fixture.componentRef.setInput('previewCode', '654321');

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('654321');
    expect(compiled.textContent).toContain('received and auto-filled from the server');
  });

  it('should render demo mode notification when isDemoMode is true', () => {
    fixture.componentRef.setInput('signUpEmail', 'test@example.com');
    fixture.componentRef.setInput('verificationCode', '123456');
    fixture.componentRef.setInput('verificationError', '');
    fixture.componentRef.setInput('verificationSuccess', '');
    fixture.componentRef.setInput('isVerifying', false);
    fixture.componentRef.setInput('isResending', false);
    fixture.componentRef.setInput('resendCooldown', 0);
    fixture.componentRef.setInput('previewCode', '123456');
    fixture.componentRef.setInput('isDemoMode', true);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Demo Mode Active');
    expect(compiled.textContent).toContain('123456');
  });

  it('should not render auto-fill notification when previewCode is empty', () => {
    fixture.componentRef.setInput('signUpEmail', 'test@example.com');
    fixture.componentRef.setInput('verificationCode', '');
    fixture.componentRef.setInput('verificationError', '');
    fixture.componentRef.setInput('verificationSuccess', '');
    fixture.componentRef.setInput('isVerifying', false);
    fixture.componentRef.setInput('isResending', false);
    fixture.componentRef.setInput('resendCooldown', 0);
    fixture.componentRef.setInput('previewCode', '');

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('received and auto-filled from the server');
  });

  it('should emit verify when confirm button is clicked', () => {
    fixture.componentRef.setInput('signUpEmail', 'test@example.com');
    fixture.componentRef.setInput('verificationCode', '654321');
    fixture.componentRef.setInput('verificationError', '');
    fixture.componentRef.setInput('verificationSuccess', '');
    fixture.componentRef.setInput('isVerifying', false);
    fixture.componentRef.setInput('isResending', false);
    fixture.componentRef.setInput('resendCooldown', 0);
    fixture.componentRef.setInput('previewCode', '654321');

    fixture.detectChanges();

    const verifySpy = vi.fn();
    component.verify.subscribe(verifySpy);

    const verifyBtn = fixture.nativeElement.querySelector('button.bg-primary') as HTMLButtonElement;
    verifyBtn.click();

    expect(verifySpy).toHaveBeenCalled();
  });

  it('should render network connection recovery card when isNetworkError is true', () => {
    fixture.componentRef.setInput('signUpEmail', 'test@example.com');
    fixture.componentRef.setInput('verificationCode', '654321');
    fixture.componentRef.setInput('verificationError', '');
    fixture.componentRef.setInput('verificationSuccess', '');
    fixture.componentRef.setInput('isVerifying', false);
    fixture.componentRef.setInput('isResending', false);
    fixture.componentRef.setInput('resendCooldown', 0);
    fixture.componentRef.setInput('previewCode', '654321');
    fixture.componentRef.setInput('isNetworkError', true);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Connection Interrupted');
    expect(compiled.textContent).toContain('Use Demo (123456)');
  });
});
