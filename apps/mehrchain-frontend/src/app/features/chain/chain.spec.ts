import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChainComponent } from './chain';
import { commonTestProviders } from '../../../testing/test-providers';
import { ChainService } from '../../core/services/chain.service';
import { CommitmentService } from '../../core/services/commitment.service';

describe('ChainComponent', () => {
  let component: ChainComponent;
  let fixture: ComponentFixture<ChainComponent>;
  let chainService: ChainService;
  let commitmentService: CommitmentService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ChainComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(ChainComponent);
    component = fixture.componentInstance;
    chainService = TestBed.inject(ChainService);
    commitmentService = TestBed.inject(CommitmentService);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should create ChainComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should sort connections by most recent activity first', async () => {
    const firstHabit = await commitmentService.addCommitment({
      title: 'Habit 1',
      category: 'growth',
      totalDays: -1,
      isPublic: true,
    });
    const secondHabit = await commitmentService.addCommitment({
      title: 'Habit 2',
      category: 'growth',
      totalDays: -1,
      isPublic: true,
    });
    vi.useFakeTimers({ toFake: ['Date'] });

    // Insert the newer activity first so insertion order differs from sort order.
    vi.setSystemTime(new Date('2026-01-02T12:00:00.000Z'));
    await chainService.acceptInvite({
      inviterName: 'Partner1',
      habitTitle: 'Habit 1',
      myCommitmentId: firstHabit.id,
    });
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    await chainService.acceptInvite({
      inviterName: 'Partner2',
      habitTitle: 'Habit 2',
      myCommitmentId: secondHabit.id,
    });

    fixture.detectChanges();
    expect(chainService.connections().map((connection) => connection.partner?.name)).toEqual([
      'Partner2',
      'Partner1',
    ]);
    const sorted = component.sortedConnections();
    expect(sorted.map((connection) => connection.partner?.name)).toEqual(['Partner1', 'Partner2']);
  });

  it('should delegate heart and disconnect actions to ChainService', async () => {
    const sendHeartSpy = vi.spyOn(chainService, 'sendHeart');
    const disconnectSpy = vi.spyOn(chainService, 'disconnect');

    component.handleHeart('conn-1');
    expect(sendHeartSpy).toHaveBeenCalledWith('conn-1');

    const request = { generationId: 'g1', reason: 'PREFER_NOT_TO_SHARE' as const };
    component.handleDisconnect({ connectionId: 'conn-1', request });
    expect(disconnectSpy).toHaveBeenCalledWith('conn-1', request);
  });

  it('should display toast when showToast is called', () => {
    component.showToast('Test Toast Notification');
    expect(component.toastMessage()).toBe('Test Toast Notification');
  });

  it('keeps invites discoverable without unfinished feature clutter', () => {
    component.activeView.set('connect');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-invite-section')).toBeTruthy();
    expect(compiled.textContent).not.toContain('Articles');
    expect(compiled.textContent).not.toContain('Coming Soon');
  });

  it('defaults to show-up view and switches between Show Up and Connect (T34)', () => {
    expect(component.activeView()).toBe('show-up');
    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button[role="tab"]'));
    expect(tabs.length).toBe(2);

    const connectTab = tabs.find((t) => t.textContent?.includes('Connect'));
    expect(connectTab).toBeTruthy();

    connectTab?.click();
    fixture.detectChanges();
    expect(component.activeView()).toBe('connect');
    expect(compiled.querySelector('app-invite-section')).toBeTruthy();

    const showUpTab = tabs.find((t) => t.textContent?.includes('Show Up'));
    showUpTab?.click();
    fixture.detectChanges();
    expect(component.activeView()).toBe('show-up');
  });
});
