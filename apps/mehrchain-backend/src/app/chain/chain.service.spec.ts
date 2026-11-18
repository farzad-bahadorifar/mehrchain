import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChainInviteStatus, ChainStatus } from '@prisma/client';
import { ChainService } from './chain.service';
import { CommitmentLifecycleService } from '../commitments/commitment-lifecycle.service';

describe('ChainService lifecycle', () => {
  const now = new Date('2026-10-15T00:00:00Z');
  const baseHabit = {
    startDate: new Date('2026-10-01T12:00:00Z'),
    lastCompletedDate: new Date('2026-10-14T12:00:00Z'),
    inactivityAnchorAt: null,
    currentDay: 10,
    currentStreak: 4,
    totalDays: -1,
    isPublic: true,
    isArchived: false,
    user: { timeZone: 'UTC' },
    title: 'Read',
    category: 'growth',
    history: ['private'],
    why: 'private',
  };
  let habits: any[];
  let invite: any;
  let connection: any;
  let hearts: Map<string, any>;
  let completions: { id: string; commitmentId: string; completedAt: Date }[];
  const prisma: any = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    meroProgress: { upsert: jest.fn(), update: jest.fn() },
    meroAcceptedPartner: { createMany: jest.fn() },
    commitment: { findMany: jest.fn(), update: jest.fn() },
    commitmentLog: { findMany: jest.fn(), findFirst: jest.fn() },
    chainInvite: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    chainConnection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    chainHeart: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    chainDisconnectReceipt: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  let service: ChainService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(now);
    hearts = new Map();
    completions = [{ id: 'event', commitmentId: 'a', completedAt: now }];
    prisma.commitmentLog.findFirst.mockImplementation(async ({ where }: any) =>
      completions.find(
        (entry) =>
          entry.id === where.id &&
          entry.commitmentId === where.commitmentId &&
          entry.completedAt <= where.completedAt.lte,
      ),
    );
    prisma.commitmentLog.findMany.mockImplementation(async ({ where }: any) =>
      completions.filter((entry) =>
        where.OR.some(
          (criterion: any) =>
            entry.commitmentId === criterion.commitmentId &&
            entry.completedAt >= criterion.completedAt.gte &&
            entry.completedAt <= criterion.completedAt.lte,
        ),
      ),
    );
    const keyFor = (h: any) => `${h.senderId}/${h.recipientCommitmentId}/${h.dayKey}`;
    prisma.chainHeart.createMany.mockImplementation(async ({ data }: any) => {
      const key = keyFor(data);
      if (hearts.has(key)) return { count: 0 };
      hearts.set(key, data);
      return { count: 1 };
    });
    prisma.chainHeart.findUnique.mockImplementation(async ({ where }: any) =>
      [...hearts.values()].find((heart) => {
        const key = where.senderId_recipientCommitmentId_completionId;
        return (
          heart.senderId === key.senderId &&
          heart.recipientCommitmentId === key.recipientCommitmentId &&
          heart.completionId === key.completionId
        );
      }),
    );
    prisma.chainHeart.findMany.mockImplementation(async ({ where }: any) =>
      [...hearts.values()].filter(
        (h) =>
          h.senderId === where.senderId &&
          where.OR.some(
            (k: any) =>
              k.completionId?.in.includes(h.completionId) ||
              (k.recipientCommitmentId === h.recipientCommitmentId && k.dayKey === h.dayKey),
          ),
      ),
    );
    habits = [
      { ...baseHabit, user: { timeZone: 'UTC' }, id: 'a', userId: 'sender' },
      { ...baseHabit, user: { timeZone: 'UTC' }, id: 'b', userId: 'receiver' },
    ];
    invite = {
      id: 'invite',
      senderId: 'sender',
      senderCommitmentId: 'a',
      inviteCode: 'code',
      status: ChainInviteStatus.PENDING,
      expiresAt: new Date('2026-10-20T00:00:00Z'),
    };
    connection = {
      id: 'c',
      generationId: 'generation-1',
      userId: 'receiver',
      partnerId: 'sender',
      userCommitmentId: 'b',
      partnerCommitmentId: 'a',
      status: ChainStatus.ACTIVE,
      heartSent: false,
      heartSentAt: null,
      lastNudgeSentAt: null,
      partner: { username: 'sender' },
      partnerCommitment: habits[0],
      userCommitment: habits[1],
      createdAt: now,
    };
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    prisma.$queryRaw.mockImplementation(async (query: any) =>
      Array.isArray(query.values) ? query.values.map((id: string) => ({ id })) : [],
    );
    prisma.meroAcceptedPartner.createMany.mockResolvedValue({ count: 1 });
    prisma.commitment.findMany.mockImplementation(async ({ where }: any) =>
      habits.filter((h) => where.id.in.includes(h.id)).map((h) => ({ ...h })),
    );
    prisma.commitment.update.mockImplementation(async ({ where, data }: any) => {
      const h = habits.find((row) => row.id === where.id);
      Object.assign(h, data);
      return h;
    });
    prisma.chainInvite.findUnique.mockImplementation(async () => invite);
    prisma.chainInvite.create.mockResolvedValue({ id: 'new-invite' });
    prisma.chainInvite.updateMany.mockImplementation(async () => {
      invite.status = ChainInviteStatus.CANCELLED;
      return { count: 1 };
    });
    prisma.chainConnection.findMany.mockResolvedValue([]);
    prisma.chainConnection.findUnique.mockImplementation(async () => connection);
    prisma.chainConnection.findUniqueOrThrow.mockImplementation(async () => connection);
    prisma.chainConnection.findFirst.mockImplementation(async () => ({
      id: 'reciprocal',
      userId: 'sender',
      partnerId: 'receiver',
      generationId: 'generation-1',
      userCommitment: { title: 'Read' },
    }));
    prisma.chainConnection.updateMany.mockImplementation(async () => {
      connection.status = ChainStatus.DISCONNECTED;
      return { count: 2 };
    });
    prisma.chainConnection.upsert.mockImplementation(async ({ create }: any) => create);
    prisma.chainConnection.update.mockImplementation(async ({ data }: any) =>
      Object.assign(connection, data),
    );
    service = new ChainService(prisma, new CommitmentLifecycleService(prisma));
  });
  afterEach(() => jest.useRealTimers());

  it('creates only invites for an owned active public habit', async () => {
    await service.createInvite('sender', { commitmentId: 'a' });
    expect(prisma.chainInvite.create).toHaveBeenCalledWith({
      data: {
        senderId: 'sender',
        senderCommitmentId: 'a',
        expiresAt: new Date('2026-10-22T00:00:00Z'),
      },
    });
    await expect(service.createInvite('receiver', { commitmentId: 'a' })).rejects.toThrow(
      NotFoundException,
    );
    habits[0].isPublic = false;
    await expect(service.createInvite('sender', { commitmentId: 'a' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects nonexistent, cancelled and expired invitations', async () => {
    invite = null;
    await expect(service.getInvite('missing')).rejects.toThrow(NotFoundException);
    invite = { id: 'invite', senderCommitmentId: 'a', status: ChainInviteStatus.CANCELLED };
    await expect(service.getInvite('code')).rejects.toThrow(BadRequestException);
    invite.status = ChainInviteStatus.PENDING;
    invite.expiresAt = now;
    await expect(service.getInvite('code')).rejects.toThrow('expired');
  });

  it('revalidates and archives an overdue sender before returning an invite', async () => {
    habits[0].lastCompletedDate = new Date('2026-10-12T12:00:00Z');
    await expect(service.getInvite('code')).rejects.toThrow(BadRequestException);
    expect(habits[0].isArchived).toBe(true);
    expect(invite.status).toBe(ChainInviteStatus.CANCELLED);
  });

  it.each(['isArchived', 'isPublic'])(
    'rejects a sender changed after initial invite lookup (%s)',
    async (field) => {
      prisma.$queryRaw.mockImplementation(async () => {
        habits[0][field] = field === 'isArchived';
        return [];
      });
      await expect(service.acceptInvite('receiver', 'code', { commitmentId: 'b' })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.chainConnection.upsert).not.toHaveBeenCalled();
    },
  );

  it('rejects an unavailable receiver, self-acceptance or wrong receiver owner', async () => {
    await expect(service.acceptInvite('sender', 'code', { commitmentId: 'a' })).rejects.toThrow(
      'own invite',
    );
    await expect(service.acceptInvite('other', 'code', { commitmentId: 'b' })).rejects.toThrow(
      NotFoundException,
    );
    habits[1].lastCompletedDate = new Date('2026-10-12T12:00:00Z');
    await expect(service.acceptInvite('receiver', 'code', { commitmentId: 'b' })).rejects.toThrow(
      BadRequestException,
    );
    expect(habits[1].isArchived).toBe(true);
    expect(prisma.chainConnection.upsert).not.toHaveBeenCalled();
  });

  it('reuses disconnected unique rows only on acceptance, clearing old support state', async () => {
    const accepted = await service.acceptInvite('receiver', 'code', { commitmentId: 'b' });
    expect(prisma.meroAcceptedPartner.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'sender', partnerId: 'receiver' }],
      skipDuplicates: true,
    });
    expect(prisma.meroAcceptedPartner.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'receiver', partnerId: 'sender' }],
      skipDuplicates: true,
    });
    expect(accepted.senderConnection).toMatchObject({
      userId: 'sender',
      partnerId: 'receiver',
      userCommitmentId: 'a',
      partnerCommitmentId: 'b',
    });
    expect(accepted.receiverConnection).toMatchObject({
      userId: 'receiver',
      partnerId: 'sender',
      userCommitmentId: 'b',
      partnerCommitmentId: 'a',
    });
    expect(prisma.chainConnection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_partnerId_userCommitmentId: {
            userId: 'sender',
            partnerId: 'receiver',
            userCommitmentId: 'a',
          },
        },
        update: expect.objectContaining({
          archivedAt: null,
          heartSent: false,
          heartSentAt: null,
          lastNudgeSentAt: null,
          status: ChainStatus.ACTIVE,
        }),
      }),
    );
    expect(invite.status).toBe(ChainInviteStatus.PENDING);
  });

  it('does not overwrite an active relationship with a different habit', async () => {
    prisma.chainConnection.findMany.mockResolvedValue([{ id: 'existing' }]);
    await expect(service.acceptInvite('receiver', 'code', { commitmentId: 'b' })).rejects.toThrow(
      'active chain',
    );
    expect(prisma.chainConnection.upsert).not.toHaveBeenCalled();
  });

  it('rejects support after inactivity reconciliation rather than undoing archive', async () => {
    habits[0].lastCompletedDate = new Date('2026-10-12T12:00:00Z');
    await expect(service.sendHeart('receiver', 'c', 'event')).rejects.toThrow(
      'no longer available',
    );
    expect(habits[0].isArchived).toBe(true);
    expect(prisma.chainConnection.update).not.toHaveBeenCalled();
  });

  it('rejects support on disconnected links and missing connections', async () => {
    connection.status = ChainStatus.DISCONNECTED;
    await expect(service.sendHeart('receiver', 'c', 'event')).rejects.toThrow(BadRequestException);
    connection = null;
    await expect(service.sendHeart('receiver', 'missing', 'event')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects missing, cross-habit and pre-link events without consuming allowance or awarding support', async () => {
    completions.push(
      { id: 'different-habit', commitmentId: 'b', completedAt: now },
      { id: 'pre-link', commitmentId: 'a', completedAt: new Date(now.getTime() - 1) },
    );
    for (const id of ['', 'made-up', 'different-habit', 'pre-link']) {
      await expect(service.sendHeart('receiver', 'c', id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    }
    expect(prisma.chainHeart.createMany).not.toHaveBeenCalled();
    expect(prisma.meroProgress.update).not.toHaveBeenCalled();
  });

  it('sends once and keeps retries/concurrent requests from undoing or inflating a heart', async () => {
    expect(await service.sendHeart('receiver', 'c', 'event')).toMatchObject({
      heartSent: true,
      heartSentAt: now,
    });
    const retries = await Promise.all([
      service.sendHeart('receiver', 'c', 'event'),
      service.sendHeart('receiver', 'c', 'event'),
    ]);
    expect(retries.every((r) => r.heartSent && r.heartSentAt?.getTime() === now.getTime())).toBe(
      true,
    );
    expect(hearts.size).toBe(1);
    expect(prisma.chainConnection.update).toHaveBeenCalledTimes(1);
  });

  it('shares the sender allowance across links and does not revive support cleared by reconnect', async () => {
    await service.sendHeart('receiver', 'c', 'event');
    const otherHabit = { ...habits[1], id: 'b2' };
    habits.push(otherHabit);
    connection = {
      ...connection,
      id: 'c2',
      userCommitmentId: 'b2',
      userCommitment: otherHabit,
      heartSent: false,
      heartSentAt: null,
    };
    const retry = await service.sendHeart('receiver', 'c2', 'event');
    expect(retry.heartSent).toBe(true);
    expect(connection.heartSent).toBe(false);
    expect(hearts.size).toBe(1);
    expect(prisma.chainConnection.update).toHaveBeenCalledTimes(1);
  });

  it('renews the allowance at the recipient midnight while the sender date stays unchanged', async () => {
    habits[0].user.timeZone = 'Asia/Tehran';
    completions.push({
      id: 'evening-event',
      commitmentId: 'a',
      completedAt: new Date('2026-10-15T20:20:00Z'),
    });
    jest.setSystemTime(new Date('2026-10-15T20:29:59Z'));
    const first = await service.sendHeart('receiver', 'c', 'event');
    expect(first.partnerCalendar.currentDayKey).toBe('2026-10-15');
    await expect(service.sendHeart('receiver', 'c', 'evening-event')).rejects.toThrow(
      'already sent',
    );
    jest.setSystemTime(new Date('2026-10-15T20:30:01Z'));
    const replay = await service.sendHeart('receiver', 'c', 'event');
    expect(replay.supportCards[0].sentAt).toEqual(first.supportCards[0].sentAt);
    expect(hearts.size).toBe(1);
    const second = await service.sendHeart('receiver', 'c', 'evening-event');
    expect(second.partnerCalendar.currentDayKey).toBe('2026-10-16');
    expect(second.calendar.currentDayKey).toBe('2026-10-15');
    expect(hearts.size).toBe(2);
    expect(prisma.chainConnection.update).toHaveBeenCalledTimes(2);
  });

  it('rejects private targets and obsolete nudges without persisting reactions', async () => {
    await expect(service.sendNudge('receiver', 'c')).rejects.toThrow('no longer available');
    habits[0].isPublic = false;
    await expect(service.sendHeart('receiver', 'c', 'event')).rejects.toThrow(
      'no longer available',
    );
    expect(prisma.chainHeart.createMany).not.toHaveBeenCalled();
    expect(prisma.chainConnection.update).not.toHaveBeenCalled();
  });

  it('disconnects the exact reciprocal pair and clears support', async () => {
    await service.disconnect('receiver', 'c', {
      generationId: 'generation-1',
      reason: 'TAKING_BREAK',
      note: '  A little space  ',
    });
    expect(prisma.chainDisconnectReceipt.create).toHaveBeenCalledWith({
      data: {
        recipientId: 'sender',
        partnerId: 'receiver',
        recipientConnectionId: 'reciprocal',
        generationId: 'generation-1',
        recipientHabitTitle: 'Read',
        reason: 'TAKING_BREAK',
        note: 'A little space',
        createdAt: now,
      },
    });
    expect(prisma.chainConnection.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            userId: 'receiver',
            partnerId: 'sender',
            userCommitmentId: 'b',
            partnerCommitmentId: 'a',
          },
          {
            userId: 'sender',
            partnerId: 'receiver',
            userCommitmentId: 'a',
            partnerCommitmentId: 'b',
          },
        ],
      },
      data: {
        status: ChainStatus.DISCONNECTED,
        archivedAt: now,
        heartSent: false,
        heartSentAt: null,
      },
    });
    prisma.chainConnection.updateMany.mockClear();
    await service.disconnect('receiver', 'c', {
      generationId: 'generation-1',
      reason: 'TAKING_BREAK',
    });
    expect(prisma.chainConnection.updateMany).not.toHaveBeenCalled();
    expect(prisma.chainDisconnectReceipt.create).toHaveBeenCalledTimes(1);
  });

  it('rejects an old disconnect after the same connection row has been reaccepted', async () => {
    connection.generationId = 'new-generation';
    await expect(
      service.disconnect('receiver', 'c', {
        generationId: 'generation-1',
        reason: 'TAKING_BREAK',
      }),
    ).rejects.toThrow('chain has changed');
    expect(prisma.chainDisconnectReceipt.create).not.toHaveBeenCalled();
    expect(prisma.chainConnection.updateMany).not.toHaveBeenCalled();
  });

  it('does not detach when the durable receipt cannot be saved', async () => {
    prisma.chainDisconnectReceipt.create.mockRejectedValueOnce(new Error('write failed'));
    await expect(
      service.disconnect('receiver', 'c', {
        generationId: 'generation-1',
        reason: 'OTHER',
      }),
    ).rejects.toThrow('write failed');
    expect(prisma.chainConnection.updateMany).not.toHaveBeenCalled();
    expect(connection.status).toBe(ChainStatus.ACTIVE);
  });

  it('never stores an explanation for the non-disclosing choice or modifies the heart ledger', async () => {
    await service.sendHeart('receiver', 'c', 'event');
    await service.disconnect('receiver', 'c', {
      generationId: 'generation-1',
      reason: 'PREFER_NOT_TO_SHARE',
      note: 'Do not disclose',
    });
    expect(prisma.chainDisconnectReceipt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ reason: 'PREFER_NOT_TO_SHARE', note: null }),
    });
    expect(hearts.size).toBe(1);
  });

  it('allows only the recipient to list or dismiss receipts, independently of active connections', async () => {
    prisma.chainDisconnectReceipt.findMany.mockResolvedValue([{ id: 'receipt' }]);
    expect(await service.getDisconnectReceipts('recipient')).toEqual([{ id: 'receipt' }]);
    expect(prisma.chainDisconnectReceipt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: 'recipient', readAt: null },
        take: 50,
      }),
    );
    await service.dismissDisconnectReceipt('outsider', 'receipt');
    expect(prisma.chainDisconnectReceipt.updateMany).toHaveBeenCalledWith({
      where: { id: 'receipt', recipientId: 'outsider', readAt: null },
      data: { readAt: now },
    });
  });

  it('returns limited partner data and derives the partner calendar state', async () => {
    prisma.chainConnection.findMany
      .mockResolvedValueOnce([connection])
      .mockResolvedValueOnce([connection])
      .mockResolvedValueOnce([]);
    const [row] = await service.getConnections('receiver');
    expect(row.partnerCommitment).toEqual({
      title: 'Read',
      category: 'growth',
      lastCompletedDate: baseHabit.lastCompletedDate,
      consecutiveMissedDays: 0,
      isCompletedToday: false,
    });
    expect(row.status).toBe(ChainStatus.ACTIVE);
    expect(row.partnerCommitment).not.toHaveProperty('why');
    expect(row.partnerCommitment).not.toHaveProperty('history');
    expect(row.partnerCommitment).not.toHaveProperty('user');
    expect(row).not.toHaveProperty('heartReceived');
    expect(row).not.toHaveProperty('userCommitment');
  });

  it('returns an anonymous own-habit count, deduplicating supporters and using the recipient date', async () => {
    habits[1].user = { timeZone: 'Asia/Tehran' };
    jest.setSystemTime(new Date('2026-10-15T20:31:00Z'));
    const incoming = [
      { userId: 'sender', partnerCommitmentId: 'b', heartSentAt: new Date('2026-10-15T20:30:00Z') },
      { userId: 'sender', partnerCommitmentId: 'b', heartSentAt: new Date('2026-10-15T20:30:30Z') },
      {
        userId: 'another',
        partnerCommitmentId: 'b',
        heartSentAt: new Date('2026-10-15T20:30:00Z'),
      },
      {
        userId: 'yesterday',
        partnerCommitmentId: 'b',
        heartSentAt: new Date('2026-10-15T20:29:59Z'),
      },
      {
        userId: 'unrelated',
        partnerCommitmentId: 'other',
        heartSentAt: new Date('2026-10-15T20:30:00Z'),
      },
    ];
    prisma.chainConnection.findMany
      .mockResolvedValueOnce([connection])
      .mockResolvedValueOnce([connection])
      .mockResolvedValueOnce(incoming);
    const [row] = await service.getConnections('receiver');
    expect(row.receivedHeartCount).toBe(2);
    expect(row.heartSent).toBe(false);
    expect(row).not.toHaveProperty('heartReceived');
    expect(row).not.toHaveProperty('supporters');
  });
});
