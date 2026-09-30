import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerificationModalComponent } from './verification-modal';

describe('VerificationModalComponent', () => {
  let component: VerificationModalComponent;
  let fixture: ComponentFixture<VerificationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationModalComponent],
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
    expect(compiled.textContent).toContain(
      'Your verification code has been auto-filled. In the future, this code will be sent to your email.'
    );
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
    expect(compiled.textContent).not.toContain('Your verification code has been auto-filled');
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
});
