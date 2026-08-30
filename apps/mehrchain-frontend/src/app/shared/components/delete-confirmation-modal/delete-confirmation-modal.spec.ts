import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteConfirmationModal } from './delete-confirmation-modal';
import { commonTestProviders } from '../../../../testing/test-providers';
import { Commitment } from '@mehrchain/shared-data';

describe('DeleteConfirmationModal', () => {
  let component: DeleteConfirmationModal;
  let fixture: ComponentFixture<DeleteConfirmationModal>;

  const mockCommitment: Commitment = {
    id: 'comm-1',
    title: 'Daily Meditation',
    totalDays: 21,
    currentDay: 5,
    currentStreak: 5,
    isCompletedToday: false,
    startDate: new Date().toISOString(),
    category: 'growth',
    why: 'Find inner calm and mindfulness',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmationModal],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('commitment', mockCommitment);
    fixture.detectChanges();
  });

  it('should create and display the original reason why', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Find inner calm and mindfulness');
    expect(compiled.textContent).toContain('Daily Meditation');
  });

  it('should emit cancel when Keep This Habit is clicked', () => {
    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    const keepBtn = fixture.nativeElement.querySelector('mc-button[variant="primary"] button');
    keepBtn.click();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should emit confirm when Delete Anyway is clicked', () => {
    const confirmSpy = vi.fn();
    component.confirm.subscribe(confirmSpy);

    const deleteBtn = fixture.nativeElement.querySelector('mc-button[variant="danger"] button');
    deleteBtn.click();

    expect(confirmSpy).toHaveBeenCalled();
  });
});
