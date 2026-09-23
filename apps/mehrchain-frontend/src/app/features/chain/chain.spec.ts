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
    localStorage.clear();
  });

  it('should create ChainComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle QR modal state', () => {
    expect(component.isQrModalOpen()).toBe(false);
    component.toggleQrModal(true);
    expect(component.isQrModalOpen()).toBe(true);
    component.toggleQrModal(false);
    expect(component.isQrModalOpen()).toBe(false);
  });

  it('should sort connections by most recent activity first', async () => {
    // Add two connections
    await chainService.acceptInvite({
      inviterName: 'Partner1',
      habitTitle: 'Habit 1',
      myCommitmentId: 'comm-1',
    });
    await chainService.acceptInvite({
      inviterName: 'Partner2',
      habitTitle: 'Habit 2',
      myCommitmentId: 'comm-2',
    });

    fixture.detectChanges();
    const sorted = component.sortedConnections();
    expect(sorted.length).toBe(2);
    expect(sorted[0].partner?.name).toBe('Partner2');
  });

  it('should delegate heart, nudge, and disconnect actions to ChainService', async () => {
    const sendHeartSpy = vi.spyOn(chainService, 'sendHeart');
    const sendNudgeSpy = vi.spyOn(chainService, 'sendNudge');
    const disconnectSpy = vi.spyOn(chainService, 'disconnect');

    component.handleHeart('conn-1');
    expect(sendHeartSpy).toHaveBeenCalledWith('conn-1');

    await component.handleNudge('conn-1');
    expect(sendNudgeSpy).toHaveBeenCalledWith('conn-1');

    component.handleDisconnect('conn-1');
    expect(disconnectSpy).toHaveBeenCalledWith('conn-1');
  });
});
