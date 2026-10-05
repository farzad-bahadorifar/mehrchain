import { ChainStatus } from '@prisma/client';
import { ChainCronService } from './chain-cron.service';

describe('Chain calendar catch-up', () => {
  const prisma = { chainConnection: { findMany: jest.fn(), update: jest.fn() } };
  let service: ChainCronService;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-06T00:00:00Z'));
    service = new ChainCronService(prisma as any);
  });
  afterEach(() => jest.useRealTimers());
  it('catches up a sleeping service without incrementing on a repeated run', async () => {
    let row = {
      id: 'c',
      createdAt: new Date('2026-10-01T10:00:00Z'),
      status: ChainStatus.ACTIVE,
      consecutiveMissedDays: 0,
      partnerCommitment: { lastCompletedDate: new Date('2026-10-03T20:00:00Z') },
    };
    prisma.chainConnection.findMany.mockImplementation(async () => [row]);
    prisma.chainConnection.update.mockImplementation(async ({ data }) => {
      row = { ...row, ...data };
      return row;
    });
    await service.handleDailyChainFreeze();
    expect(row.status).toBe(ChainStatus.FADING);
    expect(row.consecutiveMissedDays).toBe(2);
    await service.handleDailyChainFreeze();
    expect(prisma.chainConnection.update).toHaveBeenCalledTimes(1);
  });
  it('restores active state after yesterday completion', async () => {
    prisma.chainConnection.findMany.mockResolvedValue([
      {
        id: 'c',
        createdAt: new Date('2026-10-01T10:00:00Z'),
        status: ChainStatus.RESTING,
        consecutiveMissedDays: 1,
        partnerCommitment: { lastCompletedDate: new Date('2026-10-05T20:00:00Z') },
      },
    ]);
    await service.handleDailyChainFreeze();
    expect(prisma.chainConnection.update).toHaveBeenCalledWith({
      where: { id: 'c' },
      data: { status: ChainStatus.ACTIVE, consecutiveMissedDays: 0 },
    });
  });
});
