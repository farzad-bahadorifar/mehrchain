import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChainService } from './chain.service';
import { CommitmentService } from './commitment.service';

describe('ChainService', () => {
  let service: ChainService;
  let commitmentService: CommitmentService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ChainService,
        CommitmentService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ChainService);
    commitmentService = TestBed.inject(CommitmentService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should accept incoming invite and support one-to-many chains', async () => {
    const pubHabit = await commitmentService.addCommitment({
      title: 'Daily Reading',
      isPublic: true,
      category: 'growth',
    });

    const chain1 = service.acceptInvite({
      inviterName: 'Sara',
      inviterHabitTitle: 'Morning Yoga',
      inviterCategory: 'health',
      myCommitmentId: pubHabit.id,
      myCommitmentTitle: pubHabit.title,
    });

    const chain2 = service.acceptInvite({
      inviterName: 'Ali',
      inviterHabitTitle: 'Drink Water',
      inviterCategory: 'health',
      myCommitmentId: pubHabit.id,
      myCommitmentTitle: pubHabit.title,
    });

    expect(service.friendChains().length).toBe(2);
    expect(service.getSupportersCount(pubHabit.id)).toBe(2);
    expect(chain1.partnerName).toBe('Sara');
    expect(chain2.partnerName).toBe('Ali');
  });

  it('should broadcast "Ring the Bell" to all connected chains', async () => {
    const pubHabit = await commitmentService.addCommitment({
      title: 'Meditation',
      isPublic: true,
      category: 'health',
    });

    service.acceptInvite({
      inviterName: 'Sara',
      inviterHabitTitle: 'Morning Yoga',
      myCommitmentId: pubHabit.id,
      myCommitmentTitle: pubHabit.title,
    });

    service.acceptInvite({
      inviterName: 'Reza',
      inviterHabitTitle: 'Running',
      myCommitmentId: pubHabit.id,
      myCommitmentTitle: pubHabit.title,
    });

    const res = service.ringBellBroadcast(pubHabit.id);
    expect(res.count).toBe(2);

    const chains = service.getChainsForCommitment(pubHabit.id);
    expect(chains.every((c) => c.myCompletedToday)).toBe(true);
    expect(chains[0].lastReaction?.type).toBe('cheer');
  });

  it('should send heart reaction properly', async () => {
    const pubHabit = await commitmentService.addCommitment({
      title: 'Meditation',
      isPublic: true,
    });

    const chain = service.acceptInvite({
      inviterName: 'Sara',
      inviterHabitTitle: 'Morning Yoga',
      myCommitmentId: pubHabit.id,
      myCommitmentTitle: pubHabit.title,
    });

    service.sendReaction(chain.id, 'heart');
    const updated = service.friendChains().find((c) => c.id === chain.id);
    expect(updated?.lastReaction?.type).toBe('heart');
  });
});
