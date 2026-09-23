import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChainCardComponent } from './chain-card';
import { ChainConnection } from '@mehrchain/shared-data';
import { commonTestProviders } from '../../../../../testing/test-providers';

describe('ChainCardComponent', () => {
  let component: ChainCardComponent;
  let fixture: ComponentFixture<ChainCardComponent>;

  const baseConnection: ChainConnection = {
    id: 'conn-123',
    userId: 'user-1',
    partnerId: 'user-2',
    userCommitmentId: 'comm-1',
    partnerCommitmentId: 'comm-2',
    status: 'ACTIVE',
    consecutiveMissedDays: 0,
    heartSent: false,
    createdAt: new Date().toISOString(),
    partner: {
      username: 'sara_habits',
      name: 'Sara Smith',
    },
    partnerCommitment: {
      title: 'Morning Meditation',
      category: 'health',
      lastCompletedDate: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChainCardComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(ChainCardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('connection', baseConnection);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display partner username, display initial and habit title', () => {
    fixture.componentRef.setInput('connection', baseConnection);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('@sara_habits');
    expect(compiled.textContent).toContain('Morning Meditation');
    expect(component.partnerAvatarInitial()).toBe('S');
  });

  it('should render WAITING state when active and not completed today', () => {
    fixture.componentRef.setInput('connection', {
      ...baseConnection,
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      partnerCommitment: {
        ...baseConnection.partnerCommitment!,
        lastCompletedDate: null,
      },
    });
    fixture.detectChanges();

    expect(component.visualState()).toBe('WAITING');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Waiting for today's spark");
  });

  it('should render COMPLETED_TODAY state when partner completed habit today', () => {
    const todayStr = new Date().toISOString();
    fixture.componentRef.setInput('connection', {
      ...baseConnection,
      status: 'ACTIVE',
      consecutiveMissedDays: 0,
      partnerCommitment: {
        ...baseConnection.partnerCommitment!,
        lastCompletedDate: todayStr,
      },
    });
    fixture.detectChanges();

    expect(component.visualState()).toBe('COMPLETED_TODAY');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Completed today');
  });

  it('should render RESTING state when consecutive missed days is 1 or status is RESTING', () => {
    fixture.componentRef.setInput('connection', {
      ...baseConnection,
      status: 'RESTING',
      consecutiveMissedDays: 1,
    });
    fixture.detectChanges();

    expect(component.visualState()).toBe('RESTING');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Resting today');
  });

  it('should render FADING state and allow sending gentle reminder', () => {
    let emittedId: string | undefined;
    component.nudge.subscribe((id) => (emittedId = id));

    fixture.componentRef.setInput('connection', {
      ...baseConnection,
      status: 'FADING',
      consecutiveMissedDays: 2,
    });
    fixture.detectChanges();

    expect(component.visualState()).toBe('FADING');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('2 days away');
    expect(compiled.textContent).toContain('Send Gentle Reminder');

    // Click nudge button
    const nudgeButton = compiled.querySelector('button.bg-rose-500\\/10') as HTMLButtonElement;
    expect(nudgeButton).toBeTruthy();
    nudgeButton.click();
    fixture.detectChanges();

    expect(emittedId).toBe('conn-123');
    expect(component.nudgeSent()).toBe(true);
    expect(compiled.textContent).toContain('Reminder Sent');
  });

  it('should render JOURNEY_COMPLETED state and allow congratulating partner', () => {
    let emittedId: string | undefined;
    component.congratulate.subscribe((id) => (emittedId = id));

    fixture.componentRef.setInput('connection', {
      ...baseConnection,
      status: 'COMPLETED',
    });
    fixture.detectChanges();

    expect(component.visualState()).toBe('JOURNEY_COMPLETED');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Completed their journey!');
    expect(compiled.textContent).toContain('Congratulate');

    // Click congratulate button
    const congratsButton = compiled.querySelector('button.bg-primary\\/10') as HTMLButtonElement;
    expect(congratsButton).toBeTruthy();
    congratsButton.click();
    fixture.detectChanges();

    expect(emittedId).toBe('conn-123');
    expect(component.congratulated()).toBe(true);
    expect(compiled.textContent).toContain('Congratulated!');
  });

  it('should emit heartToggle when heart button is clicked', () => {
    let emittedId: string | undefined;
    component.heartToggle.subscribe((id) => (emittedId = id));

    fixture.componentRef.setInput('connection', baseConnection);
    fixture.detectChanges();

    const heartBtn = fixture.nativeElement.querySelector('button[aria-label="Send silent heart"]') as HTMLButtonElement;
    expect(heartBtn).toBeTruthy();
    heartBtn.click();

    expect(emittedId).toBe('conn-123');
  });

  it('should open options menu and emit disconnect', () => {
    let disconnectedId: string | undefined;
    component.disconnect.subscribe((id) => (disconnectedId = id));

    fixture.componentRef.setInput('connection', baseConnection);
    fixture.componentRef.setInput('myHabitTitle', 'Daily Reading');
    fixture.detectChanges();

    expect(component.isMenuOpen()).toBe(false);

    // Click 3-dot options
    const optionsBtn = fixture.nativeElement.querySelector('button[aria-label="Card options"]') as HTMLButtonElement;
    optionsBtn.click();
    fixture.detectChanges();

    expect(component.isMenuOpen()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Daily Reading');

    // Click disconnect button
    const disconnectBtn = compiled.querySelector('button.text-destructive') as HTMLButtonElement;
    expect(disconnectBtn).toBeTruthy();
    disconnectBtn.click();
    fixture.detectChanges();

    expect(disconnectedId).toBe('conn-123');
    expect(component.isMenuOpen()).toBe(false);
  });
});
