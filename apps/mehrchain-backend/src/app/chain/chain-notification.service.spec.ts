import { ChainStatus } from '@prisma/client';
import { ChainNotificationService } from './chain-notification.service';

describe('ChainNotificationService (Unit Tests)', () => {
  let service: ChainNotificationService;

  const mockPrisma = {
    chainConnection: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new ChainNotificationService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('notifyChainPartners', () => {
    it('should update lastPartnerActivityAt for ACTIVE, RESTING, and FADING connections', async () => {
      mockPrisma.chainConnection.updateMany.mockResolvedValue({ count: 2 });

      await service.notifyChainPartners('comm-1');

      expect(mockPrisma.chainConnection.updateMany).toHaveBeenCalledWith({
        where: {
          userCommitmentId: 'comm-1',
          status: {
            in: [ChainStatus.ACTIVE, ChainStatus.RESTING, ChainStatus.FADING],
          },
        },
        data: {
          lastPartnerActivityAt: expect.any(Date),
        },
      });
    });

    it('should resolve without throwing when no connections exist', async () => {
      mockPrisma.chainConnection.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.notifyChainPartners('comm-no-chains')).resolves.toBeUndefined();
    });

    it('should silently handle a Prisma error without rethrowing', async () => {
      mockPrisma.chainConnection.updateMany.mockRejectedValue(new Error('DB connection lost'));

      // Should NOT throw — failure is logged and swallowed
      await expect(service.notifyChainPartners('comm-1')).resolves.toBeUndefined();
    });

    it('should not affect DORMANT or DISCONNECTED connections', async () => {
      // We verify the query only targets the 3 allowed statuses.
      // The updateMany 'where' clause excludes all other statuses by design.
      mockPrisma.chainConnection.updateMany.mockResolvedValue({ count: 0 });

      await service.notifyChainPartners('comm-dormant');

      const callArgs = mockPrisma.chainConnection.updateMany.mock.calls[0][0];
      const statusFilter: ChainStatus[] = callArgs.where.status.in;

      expect(statusFilter).not.toContain(ChainStatus.DORMANT);
      expect(statusFilter).not.toContain(ChainStatus.DISCONNECTED);
      expect(statusFilter).not.toContain(ChainStatus.COMPLETED);
    });
  });
});
