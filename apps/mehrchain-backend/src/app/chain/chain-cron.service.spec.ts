import { ChainStatus } from '@prisma/client';
import { ChainCronService } from './chain-cron.service';

describe('ChainCronService (Unit Tests)', () => {
  let service: ChainCronService;

  const mockPrisma = {
    chainConnection: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new ChainCronService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('handleDailyChainFreeze', () => {
    it('should reset missed days and set status to ACTIVE when partner completed yesterday', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      // set time during yesterday
      const yesterdayCompletedTime = new Date(yesterday.getTime() + 12 * 60 * 60 * 1000);

      mockPrisma.chainConnection.findMany.mockResolvedValue([
        {
          id: 'conn-1',
          consecutiveMissedDays: 1,
          status: ChainStatus.RESTING,
          partnerCommitment: {
            lastCompletedDate: yesterdayCompletedTime,
          },
        },
      ]);

      await service.handleDailyChainFreeze();

      expect(mockPrisma.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: {
          consecutiveMissedDays: 0,
          status: ChainStatus.ACTIVE,
          heartSent: false,
        },
      });
    });

    it('should transition to RESTING when partner missed 1 day', async () => {
      mockPrisma.chainConnection.findMany.mockResolvedValue([
        {
          id: 'conn-1',
          consecutiveMissedDays: 0,
          status: ChainStatus.ACTIVE,
          partnerCommitment: {
            lastCompletedDate: null,
          },
        },
      ]);

      await service.handleDailyChainFreeze();

      expect(mockPrisma.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: {
          consecutiveMissedDays: 1,
          status: ChainStatus.RESTING,
        },
      });
    });

    it('should transition to FADING when partner missed 2 days', async () => {
      mockPrisma.chainConnection.findMany.mockResolvedValue([
        {
          id: 'conn-2',
          consecutiveMissedDays: 1,
          status: ChainStatus.RESTING,
          partnerCommitment: {
            lastCompletedDate: null,
          },
        },
      ]);

      await service.handleDailyChainFreeze();

      expect(mockPrisma.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-2' },
        data: {
          consecutiveMissedDays: 2,
          status: ChainStatus.FADING,
        },
      });
    });

    it('should transition to DORMANT and set archivedAt when partner missed 3+ days', async () => {
      mockPrisma.chainConnection.findMany.mockResolvedValue([
        {
          id: 'conn-3',
          consecutiveMissedDays: 2,
          status: ChainStatus.FADING,
          partnerCommitment: {
            lastCompletedDate: null,
          },
        },
      ]);

      await service.handleDailyChainFreeze();

      expect(mockPrisma.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-3' },
        data: {
          consecutiveMissedDays: 3,
          status: ChainStatus.DORMANT,
          archivedAt: expect.any(Date),
        },
      });
    });

    it('should not update connection if partner completed yesterday and status is already ACTIVE with 0 missed days', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayCompletedTime = new Date(yesterday.getTime() + 10 * 60 * 60 * 1000);

      mockPrisma.chainConnection.findMany.mockResolvedValue([
        {
          id: 'conn-active',
          consecutiveMissedDays: 0,
          status: ChainStatus.ACTIVE,
          partnerCommitment: {
            lastCompletedDate: yesterdayCompletedTime,
          },
        },
      ]);

      await service.handleDailyChainFreeze();

      expect(mockPrisma.chainConnection.update).not.toHaveBeenCalled();
    });
  });
});
