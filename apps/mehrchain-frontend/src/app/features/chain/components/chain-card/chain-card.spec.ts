import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChainCardComponent } from './chain-card';
import { ChainConnection } from '@mehrchain/shared-data';
import { commonTestProviders } from '../../../../../testing/test-providers';

describe('ChainCardComponent', () => {
  let component: ChainCardComponent;
  let fixture: ComponentFixture<ChainCardComponent>;
  const connection: ChainConnection = {
    id: 'conn-1',
    generationId: 'generation-1',
    userId: 'me',
    partnerId: 'partner',
    userCommitmentId: 'own-habit',
    partnerCommitmentId: 'partner-habit',
    status: 'ACTIVE',
    consecutiveMissedDays: 0,
    heartSent: false,
    createdAt: '2026-10-18T00:00:00Z',
    partner: { username: 'sara', name: 'Sara Smith' },
    partnerCommitment: { title: 'Morning Meditation', category: 'health', isCompletedToday: false },
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChainCardComponent],
      providers: [...commonTestProviders],
    }).compileComponents();
    fixture = TestBed.createComponent(ChainCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('connection', connection);
    fixture.detectChanges();
  });
  it('shows identification and one restrained current state without named support', () => {
    fixture.componentRef.setInput('connection', { ...connection, receivedHeartCount: 2 });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Sara Smith');
    expect(text).not.toContain('@');
    expect(text).toContain('Morning Meditation');
    expect(text).toContain('Not completed today');
    expect(text).not.toContain('supported your habit');
    expect(text).not.toContain('streak');
    expect(text).not.toContain('Congratulate');
  });
  it('sends on click and keeps pending, sent and stale hearts disabled', () => {
    const sent = vi.fn();
    component.heartSend.subscribe(sent);
    const button = fixture.nativeElement.querySelector(
      'button[title="Send heart"]',
    ) as HTMLButtonElement;
    button.click();
    expect(sent).toHaveBeenCalledWith('conn-1');
    fixture.componentRef.setInput('pending', true);
    fixture.detectChanges();
    component.sendHeart();
    expect(button.disabled).toBe(true);
    expect(sent).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('pending', false);
    fixture.componentRef.setInput('connection', { ...connection, heartSent: true });
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Heart sent for this habit today');
    const heartIcon = button.querySelector('lucide-icon');
    expect(heartIcon?.getAttribute('data-sent')).toBe('true');
    expect(heartIcon?.classList.contains('fill-rose-500')).toBe(true);
    fixture.componentRef.setInput('stale', true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Refresh required');
  });
  it('offers the same heart action at a finite goal', () => {
    fixture.componentRef.setInput('connection', { ...connection, status: 'COMPLETED' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Goal reached');
    expect(fixture.nativeElement.querySelector('button[title="Send heart"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Congratulate');
  });
  it('uses server completion state even when the device UTC date matches a timestamp', () => {
    fixture.componentRef.setInput('connection', {
      ...connection,
      partnerCommitment: {
        ...connection.partnerCommitment,
        lastCompletedDate: new Date().toISOString(),
        isCompletedToday: false,
      },
    });
    fixture.detectChanges();
    expect(component.visualState()).toBe('WAITING');
    fixture.componentRef.setInput('connection', {
      ...connection,
      partnerCommitment: {
        ...connection.partnerCommitment,
        isCompletedToday: true,
      },
    });
    fixture.detectChanges();
    expect(component.visualState()).toBe('COMPLETED_TODAY');
  });
  it('keeps details/disconnect keyboard reachable and displays a retryable error', () => {
    const disconnected = vi.fn();
    component.disconnect.subscribe(disconnected);
    fixture.componentRef.setInput('myHabitTitle', 'Daily Reading');
    fixture.componentRef.setInput('errorMessage', 'Heart was not saved. Please retry.');
    const options = fixture.nativeElement.querySelector(
      'button[aria-label="Chain details and options"]',
    ) as HTMLButtonElement;
    options.click();
    fixture.detectChanges();
    expect(options.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Daily Reading');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Please retry',
    );
    const details = fixture.nativeElement.querySelector('#chain-details-conn-1') as HTMLElement;
    details.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(component.isMenuOpen()).toBe(false);
    component.toggleMenu();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button.text-destructive') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(disconnected).not.toHaveBeenCalled();
    component.selectReason('TAKING_BREAK');
    component.disconnectNote.set('A little space');
    component.confirmDisconnect();
    expect(disconnected).toHaveBeenCalledWith({
      connectionId: 'conn-1',
      request: { generationId: 'generation-1', reason: 'TAKING_BREAK', note: 'A little space' },
    });
  });

  it('cancels without sending, clears non-disclosing notes and keeps drafts through polling or failure', () => {
    const disconnected = vi.fn();
    component.disconnect.subscribe(disconnected);
    component.handleDisconnect();
    component.selectReason('OTHER');
    component.disconnectNote.set('<script>not markup</script>');
    fixture.componentRef.setInput('connection', { ...connection });
    fixture.componentRef.setInput('errorMessage', 'Please retry');
    fixture.detectChanges();
    expect(component.disconnectNote()).toBe('<script>not markup</script>');
    component.selectReason('PREFER_NOT_TO_SHARE');
    expect(component.disconnectNote()).toBe('');
    component.cancelDisconnect();
    expect(disconnected).not.toHaveBeenCalled();
    expect(component.isDisconnectOpen()).toBe(false);
  });
});
