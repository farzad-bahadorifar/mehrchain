import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChainInviteStatus, ChainStatus } from '@prisma/client';
import { ChainService } from './chain.service';

describe('ChainService (Unit Tests)', () => {
  let service: ChainService;

  const mockPrisma = {
    commitment: {
      findUnique: jest.fn(),
    },
    chainInvite: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chainConnection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    service = new ChainService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('createInvite', () => {
    it('should throw NotFoundException if commitment does not exist', async () => {
      mockPrisma.commitment.findUnique.mockResolvedValue(null);

      await expect(
        service.createInvite('user-1', { commitmentId: 'comm-1' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if commitment is not public', async () => {
      mockPrisma.commitment.findUnique.mockResolvedValue({
        id: 'comm-1',
        userId: 'user-1',
        isPublic: false,
      });

      await expect(
        service.createInvite('user-1', { commitmentId: 'comm-1' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create invite with 7-day expiration when commitment is public', async () => {
      mockPrisma.commitment.findUnique.mockResolvedValue({
        id: 'comm-1',
        userId: 'user-1',
        isPublic: true,
      });

      const mockInvite = {
        id: 'invite-1',
        inviteCode: 'inv-code-123',
        senderId: 'user-1',
        senderCommitmentId: 'comm-1',
        status: ChainInviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      mockPrisma.chainInvite.create.mockResolvedValue(mockInvite);

      const result = await service.createInvite('user-1', { commitmentId: 'comm-1' });

      expect(mockPrisma.commitment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comm-1', userId: 'user-1' },
      });
      expect(mockPrisma.chainInvite.create).toHaveBeenCalledWith({
        data: {
          senderId: 'user-1',
          senderCommitmentId: 'comm-1',
          expiresAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockInvite);
    });
  });

  describe('getInvite', () => {
    it('should throw NotFoundException if invite does not exist', async () => {
      mockPrisma.chainInvite.findUnique.mockResolvedValue(null);

      await expect(service.getInvite('invalid-code')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if invite is not PENDING', async () => {
      mockPrisma.chainInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviteCode: 'code-1',
        status: ChainInviteStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(service.getInvite('code-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invite has expired', async () => {
      const pastDate = new Date(Date.now() - 10000);
      mockPrisma.chainInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviteCode: 'code-1',
        status: ChainInviteStatus.PENDING,
        expiresAt: pastDate,
      });

      await expect(service.getInvite('code-1')).rejects.toThrow(BadRequestException);
    });

    it('should return invite details if valid and pending', async () => {
      const futureDate = new Date(Date.now() + 100000);
      const mockInvite = {
        id: 'inv-1',
        inviteCode: 'code-1',
        status: ChainInviteStatus.PENDING,
        expiresAt: futureDate,
        sender: { username: 'alice', name: 'Alice' },
        senderCommitment: { title: 'Study', category: 'career' },
      };
      mockPrisma.chainInvite.findUnique.mockResolvedValue(mockInvite);

      const result = await service.getInvite('code-1');

      expect(result).toEqual(mockInvite);
      expect(mockPrisma.chainInvite.findUnique).toHaveBeenCalledWith({
        where: { inviteCode: 'code-1' },
        include: {
          sender: { select: { username: true, name: true } },
          senderCommitment: { select: { title: true, category: true } },
        },
      });
    });
  });

  describe('acceptInvite', () => {
    it('should throw BadRequestException if user accepts their own invite', async () => {
      const futureDate = new Date(Date.now() + 100000);
      mockPrisma.chainInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviteCode: 'code-1',
        senderId: 'user-1',
        status: ChainInviteStatus.PENDING,
        expiresAt: futureDate,
      });

      await expect(
        service.acceptInvite('user-1', 'code-1', { commitmentId: 'comm-2' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if receiver commitment does not exist', async () => {
      const futureDate = new Date(Date.now() + 100000);
      mockPrisma.chainInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviteCode: 'code-1',
        senderId: 'user-1',
        senderCommitmentId: 'comm-1',
        status: ChainInviteStatus.PENDING,
        expiresAt: futureDate,
      });
      mockPrisma.commitment.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptInvite('user-2', 'code-1', { commitmentId: 'comm-2' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should execute transaction and create reciprocal chain connections', async () => {
      const futureDate = new Date(Date.now() + 100000);
      mockPrisma.chainInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviteCode: 'code-1',
        senderId: 'user-1',
        senderCommitmentId: 'comm-1',
        status: ChainInviteStatus.PENDING,
        expiresAt: futureDate,
      });
      mockPrisma.commitment.findUnique.mockResolvedValue({
        id: 'comm-2',
        userId: 'user-2',
      });

      const mockSenderConnection = {
        id: 'conn-1',
        userId: 'user-1',
        partnerId: 'user-2',
        userCommitmentId: 'comm-1',
        partnerCommitmentId: 'comm-2',
      };
      const mockReceiverConnection = {
        id: 'conn-2',
        userId: 'user-2',
        partnerId: 'user-1',
        userCommitmentId: 'comm-2',
        partnerCommitmentId: 'comm-1',
      };

      const mockTx = {
        chainInvite: { update: jest.fn().mockResolvedValue({}) },
        chainConnection: {
          create: jest
            .fn()
            .mockResolvedValueOnce(mockSenderConnection)
            .mockResolvedValueOnce(mockReceiverConnection),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      const result = await service.acceptInvite('user-2', 'code-1', { commitmentId: 'comm-2' });

      expect(mockTx.chainInvite.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: {
          status: ChainInviteStatus.ACCEPTED,
          acceptedById: 'user-2',
          acceptedCommitmentId: 'comm-2',
        },
      });
      expect(mockTx.chainConnection.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'user-1',
          partnerId: 'user-2',
          userCommitmentId: 'comm-1',
          partnerCommitmentId: 'comm-2',
        },
      });
      expect(mockTx.chainConnection.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'user-2',
          partnerId: 'user-1',
          userCommitmentId: 'comm-2',
          partnerCommitmentId: 'comm-1',
        },
      });
      expect(result).toEqual({
        senderConnection: mockSenderConnection,
        receiverConnection: mockReceiverConnection,
      });
    });
  });

  describe('getConnections', () => {
    it('should return user connections ordered by lastPartnerActivityAt desc', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          userId: 'user-1',
          partnerId: 'user-2',
          lastPartnerActivityAt: new Date(),
          partner: { username: 'bob', name: 'Bob' },
          partnerCommitment: { title: 'Exercise', category: 'health', consecutiveMissedDays: 0 },
        },
      ];
      mockPrisma.chainConnection.findMany.mockResolvedValue(mockConnections);

      const result = await service.getConnections('user-1');

      expect(mockPrisma.chainConnection.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          partner: { select: { username: true, name: true } },
          partnerCommitment: {
            select: { title: true, category: true, consecutiveMissedDays: true },
          },
        },
        orderBy: { lastPartnerActivityAt: 'desc' },
      });
      expect(result).toEqual(mockConnections);
    });
  });

  describe('sendHeart', () => {
    it('should throw NotFoundException if connection does not exist', async () => {
      mockPrisma.chainConnection.findUnique.mockResolvedValue(null);

      await expect(service.sendHeart('user-1', 'conn-1')).rejects.toThrow(NotFoundException);
    });

    it('should toggle heartSent from false to true', async () => {
      mockPrisma.chainConnection.findUnique.mockResolvedValue({
        id: 'conn-1',
        userId: 'user-1',
        heartSent: false,
      });
      mockPrisma.chainConnection.update.mockResolvedValue({
        id: 'conn-1',
        heartSent: true,
      });

      const result = await service.sendHeart('user-1', 'conn-1');

      expect(mockPrisma.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { heartSent: true },
      });
      expect(result.heartSent).toBe(true);
    });

    it('should toggle heartSent from true to false', async () => {
      mockPrisma.chainConnection.findUnique.mockResolvedValue({
        id: 'conn-1',
        userId: 'user-1',
        heartSent: true,
      });
      mockPrisma.chainConnection.update.mockResolvedValue({
        id: 'conn-1',
        heartSent: false,
      });

      const result = await service.sendHeart('user-1', 'conn-1');

      expect(mockPrisma.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { heartSent: false },
      });
      expect(result.heartSent).toBe(false);
    });
  });

  describe('sendNudge', () => {
    it('should throw NotFoundException if connection does not exist', async () => {
      mockPrisma.chainConnection.findUnique.mockResolvedValue(null);

      await expect(service.sendNudge('user-1', 'conn-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if connection status is neither FADING nor COMPLETED', async () => {
      mockPrisma.chainConnection.findUnique.mockResolvedValue({
        id: 'conn-1',
        userId: 'user-1',
        status: ChainStatus.ACTIVE,
      });

      await expect(service.sendNudge('user-1', 'conn-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if nudge was sent less than 24 hours ago', async () => {
      const recentNudge = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      mockPrisma.chainConnection.findUnique.mockResolvedValue({
        id: 'conn-1',
        userId: 'user-1',
        status: ChainStatus.FADING,
        lastNudgeSentAt: recentNudge,
      });

      await expect(service.sendNudge('user-1', 'conn-1')).rejects.toThrow(BadRequestException);
    });

    it('should send nudge if connection is FADING and no previous nudge was sent', async () => {
      mockPrisma.chainConnection.findUnique.mockResolvedValue({
        id: 'conn-1',
        userId: 'user-1',
        status: ChainStatus.FADING,
        lastNudgeSentAt: null,
      });
      mockPrisma.chainConnection.update.mockResolvedValue({
        id: 'conn-1',
        lastNudgeSentAt: new Date(),
      });

      const result = await service.sendNudge('user-1', 'conn-1');

      expect(mockPrisma.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { lastNudgeSentAt: expect.any(Date) },
      });
      expect(result).toBeDefined();
    });

    it('should send nudge if connection is COMPLETED and previous nudge was sent >24h ago', async () => {
      const oldNudge = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      mockPrisma.chainConnection.findUnique.mockResolvedValue({
        id: 'conn-1',
        userId: 'user-1',
        status: ChainStatus.COMPLETED,
        lastNudgeSentAt: oldNudge,
      });
      mockPrisma.chainConnection.update.mockResolvedValue({
        id: 'conn-1',
        lastNudgeSentAt: new Date(),
      });

      const result = await service.sendNudge('user-1', 'conn-1');

      expect(mockPrisma.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { lastNudgeSentAt: expect.any(Date) },
      });
      expect(result).toBeDefined();
    });
  });

  describe('disconnect', () => {
    it('should throw NotFoundException if connection does not exist', async () => {
      mockPrisma.chainConnection.findUnique.mockResolvedValue(null);

      await expect(service.disconnect('user-1', 'conn-1')).rejects.toThrow(NotFoundException);
    });

    it('should disconnect both sides in transaction when partner connection exists', async () => {
      mockPrisma.chainConnection.findUnique.mockResolvedValue({
        id: 'conn-1',
        userId: 'user-1',
        partnerId: 'user-2',
      });

      const mockTx = {
        chainConnection: {
          update: jest.fn().mockResolvedValue({}),
          findFirst: jest.fn().mockResolvedValue({
            id: 'conn-partner',
            userId: 'user-2',
            partnerId: 'user-1',
          }),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await service.disconnect('user-1', 'conn-1');

      expect(mockTx.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { status: ChainStatus.DISCONNECTED },
      });
      expect(mockTx.chainConnection.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-2',
          partnerId: 'user-1',
        },
      });
      expect(mockTx.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-partner' },
        data: { status: ChainStatus.DISCONNECTED },
      });
    });

    it('should disconnect only user side if partner connection does not exist', async () => {
      mockPrisma.chainConnection.findUnique.mockResolvedValue({
        id: 'conn-1',
        userId: 'user-1',
        partnerId: 'user-2',
      });

      const mockTx = {
        chainConnection: {
          update: jest.fn().mockResolvedValue({}),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await service.disconnect('user-1', 'conn-1');

      expect(mockTx.chainConnection.update).toHaveBeenCalledTimes(1);
      expect(mockTx.chainConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { status: ChainStatus.DISCONNECTED },
      });
    });
  });
});
