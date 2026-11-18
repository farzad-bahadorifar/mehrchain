import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ChainStatus, ChainInviteStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { DisconnectChainDto } from './dto/disconnect-chain.dto';
import { lockMeroAccounts, recordMeroAcceptance } from '../mero/mero-rewards';
import { chainState } from './chain-state';
import { CommitmentLifecycleService } from '../commitments/commitment-lifecycle.service';
import {
  commitmentCalendar,
  dailyCommitmentState,
  localDay,
} from '../commitments/commitment-calendar';

const connectionInclude = {
  partner: { select: { username: true, name: true } },
  userCommitment: { include: { user: { select: { timeZone: true } } } },
  partnerCommitment: { include: { user: { select: { timeZone: true } } } },
} satisfies Prisma.ChainConnectionInclude;
type Connection = Prisma.ChainConnectionGetPayload<{ include: typeof connectionInclude }>;
type SupportCard = {
  completionId: string;
  completedAt: Date;
  sentAt: Date | null;
  allowanceUsed: boolean;
};

@Injectable()
export class ChainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: CommitmentLifecycleService,
  ) {}

  async createInvite(userId: string, dto: CreateInviteDto) {
    return this.lifecycle.withCommitments([dto.commitmentId], async (tx, habits, now) => {
      const habit = habits.find((h) => h.id === dto.commitmentId && h.userId === userId);
      if (!habit) return new NotFoundException('Commitment not found');
      if (habit.isArchived || !habit.isPublic)
        return new BadRequestException('Choose an active public habit');
      return tx.chainInvite.create({
        data: {
          senderId: userId,
          senderCommitmentId: habit.id,
          expiresAt: new Date(now.getTime() + 7 * 86400000),
        },
      });
    });
  }

  private inviteError(invite: { status: ChainInviteStatus; expiresAt: Date }, now: Date) {
    if (invite.status !== ChainInviteStatus.PENDING)
      return new BadRequestException('Invite is not pending');
    if (invite.expiresAt <= now) return new BadRequestException('Invite has expired');
    return null;
  }

  async getInvite(inviteCode: string) {
    const initial = await this.prisma.chainInvite.findUnique({ where: { inviteCode } });
    if (!initial) throw new NotFoundException('Invite not found');
    return this.lifecycle.withCommitments([initial.senderCommitmentId], async (tx, habits, now) => {
      const invite = await tx.chainInvite.findUnique({
        where: { inviteCode },
        include: {
          sender: { select: { username: true, name: true } },
          senderCommitment: {
            select: { title: true, category: true, isPublic: true, isArchived: true },
          },
        },
      });
      if (!invite) return new NotFoundException('Invite not found');
      const error = this.inviteError(invite, now);
      if (error) return error;
      const habit = habits.find((h) => h.id === invite.senderCommitmentId);
      if (!habit || habit.isArchived || !habit.isPublic)
        return new BadRequestException('This habit is no longer available for chaining');
      return invite;
    });
  }

  async acceptInvite(userId: string, inviteCode: string, dto: AcceptInviteDto) {
    const initial = await this.prisma.chainInvite.findUnique({ where: { inviteCode } });
    if (!initial) throw new NotFoundException('Invite not found');
    return this.lifecycle.withCommitments(
      [initial.senderCommitmentId, dto.commitmentId],
      async (tx, habits, now) => {
        // Habit locks precede the invite lock, including archive/privatize.
        await tx.$queryRaw`SELECT "id" FROM "chain_invites" WHERE "id" = ${initial.id} FOR UPDATE`;
        const invite = await tx.chainInvite.findUnique({ where: { id: initial.id } });
        if (!invite) return new NotFoundException('Invite not found');
        const error = this.inviteError(invite, now);
        if (error) return error;
        if (invite.senderId === userId)
          return new BadRequestException('You cannot accept your own invite');
        const sender = habits.find(
          (h) => h.id === invite.senderCommitmentId && h.userId === invite.senderId,
        );
        const receiver = habits.find((h) => h.id === dto.commitmentId && h.userId === userId);
        if (!receiver) return new NotFoundException('Your commitment not found');
        if (!sender || [sender, receiver].some((h) => h.isArchived || !h.isPublic))
          return new BadRequestException('Both habits must be active and public');

        const senderKey = {
          userId: invite.senderId,
          partnerId: userId,
          userCommitmentId: sender.id,
        };
        const receiverKey = { userId, partnerId: invite.senderId, userCommitmentId: receiver.id };
        const existing = await tx.chainConnection.findMany({
          where: { OR: [senderKey, receiverKey], status: { not: ChainStatus.DISCONNECTED } },
        });
        if (existing.length)
          return new BadRequestException(
            'These habits already have an active chain with this partner',
          );

        // Reuse disconnected unique rows only after explicit new acceptance.
        // Reset every connection-local field so old hearts/nudges cannot reappear.
        const fresh = {
          generationId: randomUUID(),
          status: ChainStatus.ACTIVE,
          consecutiveMissedDays: 0,
          lastPartnerActivityAt: null,
          lastNudgeSentAt: null,
          heartSent: false,
          heartSentAt: null,
          archivedAt: null,
          createdAt: now,
        };
        const senderConnection = await tx.chainConnection.upsert({
          where: { userId_partnerId_userCommitmentId: senderKey },
          create: { ...senderKey, partnerCommitmentId: receiver.id, ...fresh },
          update: { partnerCommitmentId: receiver.id, ...fresh },
        });
        const receiverConnection = await tx.chainConnection.upsert({
          where: { userId_partnerId_userCommitmentId: receiverKey },
          create: { ...receiverKey, partnerCommitmentId: sender.id, ...fresh },
          update: { partnerCommitmentId: sender.id, ...fresh },
        });
        await recordMeroAcceptance(tx, invite.senderId, userId);
        // Invites remain shareable with multiple partners until expiry/cancellation.
        return { senderConnection, receiverConnection };
      },
    );
  }

  async getConnections(userId: string) {
    const initial = await this.prisma.chainConnection.findMany({
      where: { userId, status: { not: ChainStatus.DISCONNECTED } },
      select: { userCommitmentId: true, partnerCommitmentId: true },
    });
    return this.lifecycle.withCommitments(
      initial.flatMap((c) => [c.userCommitmentId, c.partnerCommitmentId]),
      async (tx, habits, now) => {
        const ids = habits.map((h) => h.id);
        const available = {
          status: { not: ChainStatus.DISCONNECTED },
          userCommitmentId: { in: ids },
          partnerCommitmentId: { in: ids },
          userCommitment: { isArchived: false, isPublic: true },
          partnerCommitment: { isArchived: false, isPublic: true },
        };
        const connections = await tx.chainConnection.findMany({
          where: { userId, ...available },
          include: connectionInclude,
          orderBy: { lastPartnerActivityAt: 'desc' },
        });
        const incoming = await tx.chainConnection.findMany({
          where: { partnerId: userId, heartSent: true, ...available },
        });
        const startByHabit = new Map<string, Date>();
        for (const connection of connections) {
          const start = startByHabit.get(connection.partnerCommitmentId);
          if (!start || start > connection.createdAt)
            startByHabit.set(connection.partnerCommitmentId, connection.createdAt);
        }
        const completions = connections.length
          ? await tx.commitmentLog.findMany({
              where: {
                dayKey: { not: null },
                OR: [...startByHabit].map(([commitmentId, start]) => ({
                  commitmentId,
                  completedAt: { gte: start, lte: now },
                })),
              },
              select: { id: true, commitmentId: true, completedAt: true },
              orderBy: [{ completedAt: 'desc' }, { id: 'asc' }],
            })
          : [];
        const sent = connections.length
          ? await tx.chainHeart.findMany({
              where: {
                senderId: userId,
                OR: [
                  { completionId: { in: completions.map((completion) => completion.id) } },
                  ...connections.map((connection) => ({
                    recipientCommitmentId: connection.partnerCommitmentId,
                    dayKey: localDay(now, connection.partnerCommitment.user.timeZone),
                  })),
                ],
              },
            })
          : [];
        const sentByCompletion = new Map(sent.map((heart) => [heart.completionId, heart]));
        return connections.map((connection) => {
          const dayKey = localDay(now, connection.partnerCommitment.user.timeZone);
          const daily = sent.find(
            (heart) =>
              heart.recipientCommitmentId === connection.partnerCommitmentId &&
              heart.dayKey === dayKey,
          );
          const supportCards: SupportCard[] = [];
          for (const completion of completions) {
            if (
              completion.commitmentId !== connection.partnerCommitmentId ||
              completion.completedAt < connection.createdAt
            )
              continue;
            const acknowledgement = sentByCompletion.get(completion.id);
            if (acknowledgement && acknowledgement.dayKey !== dayKey) continue;
            supportCards.push({
              completionId: completion.id,
              completedAt: completion.completedAt,
              sentAt: acknowledgement?.sentAt ?? null,
              allowanceUsed: !!daily && !acknowledgement,
            });
          }
          return this.connectionResponse(
            connection,
            daily?.sentAt ?? null,
            incoming,
            now,
            supportCards,
          );
        });
      },
    );
  }

  private connectionResponse(
    c: Connection,
    sentAt: Date | null,
    incoming: { userId: string; partnerCommitmentId: string; heartSentAt: Date | null }[],
    now: Date,
    supportCards: SupportCard[] = [],
  ) {
    const { userCommitment, partnerCommitment, ...row } = c;
    const calendar = commitmentCalendar(userCommitment.user.timeZone, now);
    const partnerCalendar = commitmentCalendar(partnerCommitment.user.timeZone, now);
    const state = chainState(c, now);
    const receivedHeartCount = new Set(
      incoming
        .filter(
          (heart) =>
            heart.partnerCommitmentId === c.userCommitmentId &&
            heart.heartSentAt &&
            localDay(heart.heartSentAt, calendar.timeZone) === calendar.currentDayKey,
        )
        .map((heart) => heart.userId),
    ).size;
    return {
      ...row,
      // Only habit identification and current state are shared with a partner.
      partnerCommitment: {
        title: partnerCommitment.title,
        category: partnerCommitment.category,
        lastCompletedDate: partnerCommitment.lastCompletedDate,
        isCompletedToday: dailyCommitmentState(partnerCommitment, partnerCalendar).isCompletedToday,
        consecutiveMissedDays: state?.consecutiveMissedDays ?? 0,
      },
      ...(state || {}),
      heartSent: sentAt !== null,
      heartSentAt: sentAt,
      supportCards,
      receivedHeartCount,
      calendar,
      partnerCalendar,
    };
  }

  async cancelInvite(userId: string, inviteId: string) {
    const invite = await this.prisma.chainInvite.findUnique({
      where: { id: inviteId, senderId: userId },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    return this.prisma.chainInvite.update({
      where: { id: invite.id },
      data: { status: ChainInviteStatus.CANCELLED },
    });
  }

  private async withConnection<T>(
    userId: string,
    id: string,
    work: (tx: Prisma.TransactionClient, c: Connection, now: Date) => Promise<T | HttpException>,
    allowDisconnected = false,
  ): Promise<T> {
    const initial = await this.prisma.chainConnection.findUnique({ where: { id, userId } });
    if (!initial) throw new NotFoundException('Connection not found');
    return this.lifecycle.withCommitments(
      [initial.userCommitmentId, initial.partnerCommitmentId],
      async (tx, habits, now) => {
        // Support/disconnect serialize with each other, with the same reciprocal
        // row order used by archive.
        await tx.$queryRaw(Prisma.sql`
          SELECT "id" FROM "chain_connections"
          WHERE ("userCommitmentId" = ${initial.userCommitmentId} AND "partnerCommitmentId" = ${initial.partnerCommitmentId})
             OR ("userCommitmentId" = ${initial.partnerCommitmentId} AND "partnerCommitmentId" = ${initial.userCommitmentId})
          ORDER BY "id" FOR UPDATE
        `);
        const c = await tx.chainConnection.findUnique({
          where: { id, userId },
          include: connectionInclude,
        });
        if (!c) return new NotFoundException('Connection not found');
        if (
          c.userCommitmentId !== initial.userCommitmentId ||
          c.partnerCommitmentId !== initial.partnerCommitmentId
        )
          return new BadRequestException('This chain has changed. Please refresh');
        if (
          !allowDisconnected &&
          (c.status === ChainStatus.DISCONNECTED ||
            habits.length !== 2 ||
            habits.some((h) => h.isArchived || !h.isPublic))
        )
          return new BadRequestException('This chain is no longer available');
        return work(tx, c, now);
      },
    );
  }

  async sendHeart(userId: string, connectionId: string, completionId: string) {
    return this.withConnection(userId, connectionId, async (tx, c, now) => {
      if (!completionId) return new BadRequestException('Select a partner completion.');
      const completion = await tx.commitmentLog.findFirst({
        where: {
          id: completionId,
          commitmentId: c.partnerCommitmentId,
          dayKey: { not: null },
          completedAt: { lte: now },
        },
        select: { id: true, completedAt: true },
      });
      if (!completion) return new BadRequestException('This completion is not available.');
      const key = {
        senderId: userId,
        recipientCommitmentId: c.partnerCommitmentId,
        dayKey: localDay(now, c.partnerCommitment.user.timeZone),
      };
      const acknowledged = await tx.chainHeart.findUnique({
        where: {
          senderId_recipientCommitmentId_completionId: {
            senderId: userId,
            recipientCommitmentId: c.partnerCommitmentId,
            completionId,
          },
        },
      });
      if (!acknowledged) {
        if (completion.completedAt < c.createdAt)
          return new BadRequestException('This completion is not available.');
        const created = await tx.chainHeart.createMany({
          data: { ...key, completionId, sentAt: now },
          skipDuplicates: true,
        });
        if (!created.count)
          return new ConflictException('You have already sent a heart for this habit today.');
        await tx.chainConnection.update({
          where: { id: c.id },
          data: { heartSent: true, heartSentAt: now },
        });
        await lockMeroAccounts(tx, [userId]);
        await tx.meroProgress.update({ where: { userId }, data: { hasSentSupport: true } });
      }
      const incoming = await tx.chainConnection.findMany({
        where: {
          partnerId: userId,
          partnerCommitmentId: c.userCommitmentId,
          status: { not: ChainStatus.DISCONNECTED },
          heartSent: true,
          userCommitment: { isArchived: false, isPublic: true },
          partnerCommitment: { isArchived: false, isPublic: true },
        },
      });
      const sentAt = acknowledged?.sentAt ?? now;
      return this.connectionResponse(c, sentAt, incoming, now, [
        { completionId, completedAt: completion.completedAt, sentAt, allowanceUsed: false },
      ]);
    });
  }

  async sendNudge(userId: string, connectionId: string) {
    // Retain a clear failure for older clients without writing obsolete nudges.
    return this.withConnection(
      userId,
      connectionId,
      async () =>
        new BadRequestException('Reminders are no longer available. Send a heart instead'),
    );
  }

  async getDisconnectReceipts(userId: string) {
    return this.prisma.chainDisconnectReceipt.findMany({
      where: { recipientId: userId, readAt: null },
      select: {
        id: true,
        partner: { select: { username: true, name: true } },
        recipientHabitTitle: true,
        reason: true,
        note: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 50,
    });
  }

  async dismissDisconnectReceipt(userId: string, id: string) {
    // Scope the write to its recipient, including retries. No event existence leak.
    await this.prisma.chainDisconnectReceipt.updateMany({
      where: { id, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async disconnect(userId: string, connectionId: string, dto: DisconnectChainDto) {
    return this.withConnection(
      userId,
      connectionId,
      async (tx, c, now) => {
        if (c.generationId !== dto.generationId)
          return new BadRequestException('This chain has changed. Please refresh');
        if (c.status === ChainStatus.DISCONNECTED)
          return tx.chainConnection.findUniqueOrThrow({ where: { id: c.id } });
        const recipient = await tx.chainConnection.findFirst({
          where: {
            userId: c.partnerId,
            partnerId: userId,
            userCommitmentId: c.partnerCommitmentId,
            partnerCommitmentId: c.userCommitmentId,
            status: { not: ChainStatus.DISCONNECTED },
          },
          include: { userCommitment: { select: { title: true } } },
        });
        if (!recipient) return new BadRequestException('This chain has changed. Please refresh');
        // Snapshot only the recipient's own habit. Never copy support identities,
        // private partner habit details or text from a non-disclosing choice.
        await tx.chainDisconnectReceipt.create({
          data: {
            recipientId: recipient.userId,
            partnerId: userId,
            recipientConnectionId: recipient.id,
            generationId: recipient.generationId,
            recipientHabitTitle: recipient.userCommitment.title,
            reason: dto.reason,
            note: dto.reason === 'PREFER_NOT_TO_SHARE' ? null : dto.note?.trim() || null,
            createdAt: now,
          },
        });
        await tx.chainConnection.updateMany({
          where: {
            OR: [
              {
                userId,
                partnerId: c.partnerId,
                userCommitmentId: c.userCommitmentId,
                partnerCommitmentId: c.partnerCommitmentId,
              },
              {
                userId: c.partnerId,
                partnerId: userId,
                userCommitmentId: c.partnerCommitmentId,
                partnerCommitmentId: c.userCommitmentId,
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
        return tx.chainConnection.findUniqueOrThrow({ where: { id: c.id } });
      },
      true,
    );
  }
}
