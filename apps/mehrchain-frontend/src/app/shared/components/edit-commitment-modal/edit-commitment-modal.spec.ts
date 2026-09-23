import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditCommitmentModal } from './edit-commitment-modal';
import { commonTestProviders } from '../../../../testing/test-providers';
import { Commitment } from '@mehrchain/shared-data';

describe('EditCommitmentModal', () => {
  let component: EditCommitmentModal;
  let fixture: ComponentFixture<EditCommitmentModal>;

  const mockCommitment: Commitment = {
    id: 'comm-1',
    title: 'Evening Reading',
    totalDays: 21,
    currentDay: 3,
    currentStreak: 2,
    isCompletedToday: false,
    startDate: new Date().toISOString(),
    category: 'growth',
    why: 'Expand knowledge and wind down',
    reminderTime: '21:00',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCommitmentModal],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(EditCommitmentModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('commitment', mockCommitment);
    fixture.detectChanges();
  });

  it('should create and prefill commitment fields', () => {
    expect(component).toBeTruthy();
    expect(component.title()).toBe('Evening Reading');
    expect(component.why()).toBe('Expand knowledge and wind down');
    expect(component.duration()).toBe(21);
    expect(component.reminderTime()).toBe('21:00');
  });

  it('should allow selecting standard 14 days duration', () => {
    component.setStandardDuration(14);
    expect(component.duration()).toBe(14);
    expect(component.isCustomDuration()).toBe(false);
  });

  it('should emit save with updated data upon onSubmit', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.title.set('Deep Reading 10 pages');
    component.why.set('Build intellectual focus');
    component.duration.set(30);

    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith({
      id: 'comm-1',
      title: 'Deep Reading 10 pages',
      why: 'Build intellectual focus',
      totalDays: 30,
      category: 'growth',
      reminderTime: '21:00',
      isPublic: false,
    });
  });

  it('should invalidate and prevent submit when custom duration is 0 or negative', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.toggleCustomDuration();
    component.onCustomDurationInput('0');

    expect(component.duration()).toBe(0);
    expect(component.isDurationValid()).toBe(false);
    expect(component.isValid()).toBe(false);

    component.onSubmit();
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should keep custom mode open when entering multi-digit values', () => {
    component.toggleCustomDuration();
    expect(component.isCustomDuration()).toBe(true);

    component.onCustomDurationInput('2');
    expect(component.isCustomDuration()).toBe(true);
    expect(component.duration()).toBe(2);

    component.onCustomDurationInput('25');
    expect(component.isCustomDuration()).toBe(true);
    expect(component.duration()).toBe(25);
  });

  it('should emit close when Cancel is clicked', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    component.close.emit();
    expect(closeSpy).toHaveBeenCalled();
  });
});
