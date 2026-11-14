import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginModalComponent } from './login-modal';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('LoginModalComponent', () => {
  let component: LoginModalComponent;
  let fixture: ComponentFixture<LoginModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginModalComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginModalComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('loginEmail', '');
    fixture.componentRef.setInput('loginPassword', '');
    fixture.componentRef.setInput('loginError', '');
    fixture.componentRef.setInput('isNoAccountFound', false);
    fixture.componentRef.setInput('showLoginPassword', false);
    fixture.componentRef.setInput('isPrefilledFromSignUp', false);
    fixture.componentRef.setInput('isForgotPasswordMode', false);
    fixture.componentRef.setInput('forgotPasswordEmail', '');
    fixture.componentRef.setInput('isLoggingIn', false);
    fixture.componentRef.setInput('allowDemoMode', false);
  });

  it('should not render Quick Dev Sign-In button when allowDemoMode is false', () => {
    fixture.componentRef.setInput('allowDemoMode', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const devBtn = compiled.querySelector('button[aria-label="Quick Dev Sign-In"]') ||
      Array.from(compiled.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Quick Dev Sign-In'),
      );
    expect(devBtn).toBeUndefined();
  });

  it('should render Quick Dev Sign-In button when allowDemoMode is true', () => {
    fixture.componentRef.setInput('allowDemoMode', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const devBtn = Array.from(compiled.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Quick Dev Sign-In'),
    );
    expect(devBtn).toBeTruthy();
    expect(devBtn?.textContent).toContain('Quick Dev Sign-In (Demo Account)');
  });

  it('should emit devLogin when Quick Dev Sign-In button is clicked', () => {
    fixture.componentRef.setInput('allowDemoMode', true);
    fixture.detectChanges();

    let emitted = false;
    component.devLogin.subscribe(() => {
      emitted = true;
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const devBtn = Array.from(compiled.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Quick Dev Sign-In'),
    );
    expect(devBtn).toBeTruthy();

    devBtn?.click();
    expect(emitted).toBe(true);
  });
});
