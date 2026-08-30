import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CommitmentsService } from './commitments.service';

describe('CommitmentsService (Unit Tests)', () => {
  let service: CommitmentsService;

  const mockPrisma = {
    commitment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    commitmentLog: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new CommitmentsService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('createCommitment', () => {
    it('should create a commitment with initial day 1 and streak 0', async () => {
      const mockCreated = {
        id: 'comm-1',
        userId: 'user-1',
        title: 'Drink Water',
        category: Category.health,
        totalDays: 21,
        currentDay: 1,
        currentStreak: 0,
      };

      mockPrisma.commitment.create.mockResolvedValue(mockCreated);

      const result = await service.createCommitment('user-1', {
        title: 'Drink Water',
        category: Category.health,
        totalDays: 21,
        why: 'Stay healthy',
      });

      expect(result.currentStreak).toBe(0);
      expect(result.currentDay).toBe(1);
      expect(mockPrisma.commitment.create).toHaveBeenCalled();
    });
  });

  describe('getUserCommitments', () => {
    it('should mark isCompletedToday as true when lastCompletedDate is today', async () => {
      const today = new Date();
      mockPrisma.commitment.findMany.mockResolvedValue([
        {
          id: 'comm-1',
          title: 'Daily Stretch',
          lastCompletedDate: today,
        },
      ]);

      const result = await service.getUserCommitments('user-1');
      expect(result[0].isCompletedToday).toBe(true);
    });

    it('should mark isCompletedToday as false when lastCompletedDate is yesterday', async () => {
      const yesterday = new Date(Date.now() - 86400000);
      mockPrisma.commitment.findMany.mockResolvedValue([
        {
          id: 'comm-2',
          title: 'Daily Read',
          lastCompletedDate: yesterday,
        },
      ]);

      const result = await service.getUserCommitments('user-1');
      expect(result[0].isCompletedToday).toBe(false);
    });
  });

  describe('completeCommitment', () => {
    it('should record a log and increment streak on first completion today', async () => {
      const yesterday = new Date(Date.now() - 86400000);
      mockPrisma.commitment.findUnique.mockResolvedValue({
        id: 'comm-1',
        userId: 'user-1',
        currentStreak: 2,
        currentDay: 3,
        totalDays: 21,
        lastCompletedDate: yesterday,
      });

      mockPrisma.commitmentLog.create.mockResolvedValue({ id: 'log-1' });
      mockPrisma.commitment.update.mockResolvedValue({
        id: 'comm-1',
        userId: 'user-1',
        currentStreak: 3,
        currentDay: 4,
        totalDays: 21,
        lastCompletedDate: new Date(),
      });

      const result = await service.completeCommitment('user-1', 'comm-1', 'Felt great!');
      expect(mockPrisma.commitmentLog.create).toHaveBeenCalled();
      expect(mockPrisma.commitment.update).toHaveBeenCalled();
      expect((result as any).isCompletedToday).toBe(true);
    });

    it('should not double-increment streak if already completed today', async () => {
      const today = new Date();
      mockPrisma.commitment.findUnique.mockResolvedValue({
        id: 'comm-1',
        userId: 'user-1',
        currentStreak: 5,
        currentDay: 5,
        totalDays: 21,
        lastCompletedDate: today,
      });

      const result = await service.completeCommitment('user-1', 'comm-1');
      expect(mockPrisma.commitmentLog.create).not.toHaveBeenCalled();
      expect(mockPrisma.commitment.update).not.toHaveBeenCalled();
      expect(result.currentStreak).toBe(5);
    });

    it('should throw ForbiddenException if commitment belongs to another user', async () => {
      mockPrisma.commitment.findUnique.mockResolvedValue({
        id: 'comm-1',
        userId: 'different-user',
      });

      await expect(
        service.completeCommitment('user-1', 'comm-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if commitment does not exist', async () => {
      mockPrisma.commitment.findUnique.mockResolvedValue(null);

      await expect(
        service.completeCommitment('user-1', 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCommitment', () => {
    it('should archive the commitment', async () => {
      mockPrisma.commitment.findUnique.mockResolvedValue({
        id: 'comm-1',
        userId: 'user-1',
      });
      mockPrisma.commitment.update.mockResolvedValue({
        id: 'comm-1',
        isArchived: true,
      });

      const result = await service.deleteCommitment('user-1', 'comm-1');
      expect(result.isArchived).toBe(true);
    });
  });
});
