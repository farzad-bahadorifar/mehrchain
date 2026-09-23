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
    expect(component.isValid()).toBe(false);

    component.handleSubmit();
    expect(submitSpy).not.toHaveBeenCalled();
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

  it('should reject submission when title is too short regardless of duration', () => {
    const submitSpy = vi.fn();
    component.submit.subscribe(submitSpy);

    component.title.set('A');
    component.setStandardDuration(21);

    expect(component.isValid()).toBe(false);
    component.handleSubmit();
    expect(submitSpy).not.toHaveBeenCalled();
  });
});
