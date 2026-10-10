import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../../testing/test-providers';
import { NewCommitmentModal } from './new-commitment-modal';

describe('NewCommitmentModal', () => {
  let component: NewCommitmentModal;
  let fixture: ComponentFixture<NewCommitmentModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCommitmentModal],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(NewCommitmentModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should invalidate and prevent submit when duration is 0 or negative', () => {
    const submitSpy = vi.fn();
    component.submit.subscribe(submitSpy);

    component.title.set('Morning Jog');
    component.toggleCustomDuration();
    component.onCustomDurationInput('0');

    expect(component.duration()).toBe(0);
    expect(component.isDurationValid()).toBe(false);
    expect(component.durationErrorMessage()).toBe('Duration cannot start with 0');
    expect(component.isValid()).toBe(false);

    component.handleSubmit();
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('should reject leading zero numbers like 0111 and special characters', () => {
    const submitSpy = vi.fn();
    component.submit.subscribe(submitSpy);

    component.title.set('Morning Jog');
    component.toggleCustomDuration();

    // Leading zeros: '0111'
    component.onCustomDurationInput('0111');
    expect(component.duration()).toBe(0);
    expect(component.isDurationValid()).toBe(false);
    expect(component.durationErrorMessage()).toBe('Duration cannot start with 0');
    expect(component.isValid()).toBe(false);

    component.handleSubmit();
    expect(submitSpy).not.toHaveBeenCalled();

    // Special characters: '-5'
    component.onCustomDurationInput('-5');
    expect(component.duration()).toBe(0);
    expect(component.isDurationValid()).toBe(false);
    expect(component.durationErrorMessage()).toBe('Duration must contain digits only');

    // Numbers greater than 365
    component.onCustomDurationInput('366');
    expect(component.duration()).toBe(0);
    expect(component.isDurationValid()).toBe(false);
    expect(component.durationErrorMessage()).toBe('Maximum duration is 365 days');
  });

  it('should allow submit when custom duration is valid (> 0)', () => {
    const submitSpy = vi.fn();
    component.submit.subscribe(submitSpy);

    component.title.set('Morning Jog');
    component.toggleCustomDuration();
    component.onCustomDurationInput('30');

    expect(component.duration()).toBe(30);
    expect(component.isDurationValid()).toBe(true);
    expect(component.isValid()).toBe(true);

    component.handleSubmit();
    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Morning Jog',
        totalDays: 30,
      })
    );
  });

  it('should keep custom mode open when typing multi-digit numbers including standard values', () => {
    component.toggleCustomDuration();
    expect(component.isCustomDuration()).toBe(true);

    // Typing '7'
    component.onCustomDurationInput('7');
    expect(component.isCustomDuration()).toBe(true);
    expect(component.duration()).toBe(7);

    // Typing '70'
    component.onCustomDurationInput('70');
    expect(component.isCustomDuration()).toBe(true);
    expect(component.duration()).toBe(70);

    // Typing '100'
    component.onCustomDurationInput('100');
    expect(component.isCustomDuration()).toBe(true);
    expect(component.duration()).toBe(100);
  });

  it('should default to Endless Journey (-1) and submit successfully', () => {
    const submitSpy = vi.fn();
    component.submit.subscribe(submitSpy);

    expect(component.duration()).toBe(-1);
    expect(component.isDurationValid()).toBe(true);

    component.title.set('Read philosophy');
    expect(component.isValid()).toBe(true);

    component.handleSubmit();
    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Read philosophy',
        totalDays: -1,
      })
    );
  });

  it('should switch between Endless Journey and Custom duration', () => {
    component.toggleCustomDuration();
    expect(component.isCustomDuration()).toBe(true);
    expect(component.duration()).toBe(0);
    expect(component.customDurationText()).toBe('');

    component.onCustomDurationInput('21');
    expect(component.duration()).toBe(21);

    component.setEndlessDuration();
    expect(component.isCustomDuration()).toBe(false);
    expect(component.duration()).toBe(-1);
  });

  it('should reject submission when title is too short regardless of duration', () => {
    const submitSpy = vi.fn();
    component.submit.subscribe(submitSpy);

    component.title.set('A');
    component.setEndlessDuration();

    expect(component.isValid()).toBe(false);
    component.handleSubmit();
    expect(submitSpy).not.toHaveBeenCalled();
  });
});
