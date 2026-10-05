import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ChainStatus, ChainInviteStatus, Prisma } from '@prisma/client';
import { chainState } from './chain-state';

@Injectable()
export class ChainService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvite(userId: string, dto: CreateInviteDto) {
    const commitment = await this.prisma.commitment.findUnique({
      where: { id: dto.commitmentId, userId },
    });

    if (!commitment) throw new NotFoundException('Commitment not found');
    if (commitment.isArchived) throw new BadRequestException('Archived habits cannot be chained');
    if (!commitment.isPublic)
      throw new BadRequestException('Commitment must be public to create an invite');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.chainInvite.create({
      data: {
        senderId: userId,
        senderCommitmentId: commitment.id,
        expiresAt,
      },
    });
  }

  async getInvite(inviteCode: string) {
    const invite = await this.prisma.chainInvite.findUnique({
      where: { inviteCode },
      include: {
        sender: { select: { username: true, name: true } },
        senderCommitment: {
          select: { title: true, category: true, isPublic: true, isArchived: true },
        },
      },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== ChainInviteStatus.PENDING)
      throw new BadRequestException('Invite is not pending');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite has expired');
    if (
      invite.senderCommitment &&
      (!invite.senderCommitment.isPublic || invite.senderCommitment.isArchived)
    )
      throw new BadRequestException('This habit is no longer available for chaining');

    return invite;
  }

  async acceptInvite(userId: string, inviteCode: string, dto: AcceptInviteDto) {
    const invite = await this.getInvite(inviteCode);

    if (invite.senderId === userId) {
      throw new BadRequestException('You cannot accept your own invite');
    }

    const receiverCommitment = await this.prisma.commitment.findUnique({
      where: { id: dto.commitmentId, userId },
    });

    if (!receiverCommitment) throw new NotFoundException('Your commitment not found');
    if (receiverCommitment.isArchived || !receiverCommitment.isPublic)
      throw new BadRequestException('Choose an active public habit');

    // Start a transaction to accept invite and create two-way connection
    return this.prisma
      .$transaction(async (prisma) => {
        // Lock and revalidate the shared invite without consuming it.
        const claimed = await prisma.chainInvite.updateMany({
          where: {
            id: invite.id,
            status: ChainInviteStatus.PENDING,
            expiresAt: { gt: new Date() },
          },
          data: {
            status: ChainInviteStatus.PENDING,
          },
        });
        if (claimed.count !== 1)
          throw new BadRequestException('Invite has been cancelled or has expired');

        // 2. Create ChainConnection (from Sender's perspective)
        const senderConnection = await prisma.chainConnection.create({
          data: {
            userId: invite.senderId,
            partnerId: userId,
            userCommitmentId: invite.senderCommitmentId,
            partnerCommitmentId: dto.commitmentId,
          },
        });

        // 3. Create ChainConnection (from Receiver's perspective)
        const receiverConnection = await prisma.chainConnection.create({
          data: {
            userId: userId,
            partnerId: invite.senderId,
            userCommitmentId: dto.commitmentId,
            partnerCommitmentId: invite.senderCommitmentId,
          },
        });

        return { senderConnection, receiverConnection };
      })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
          throw new BadRequestException('These habits are already chained');
        throw error;
      });
  }

  async getConnections(userId: string) {
    const connections = await this.prisma.chainConnection.findMany({
      where: { userId, status: { not: ChainStatus.DISCONNECTED } },
      include: {
        partner: { select: { username: true, name: true } },
        partnerCommitment: {
          select: {
            title: true,
            category: true,
            consecutiveMissedDays: true,
            lastCompletedDate: true,
          },
        },
      },
      orderBy: { lastPartnerActivityAt: 'desc' },
    });
    const incoming = await this.prisma.chainConnection.findMany({
      where: { partnerId: userId, status: { not: ChainStatus.DISCONNECTED }, heartSent: true },
    });
    const today = new Date().toISOString().slice(0, 10);
    const sentToday = (c: { heartSent: boolean; heartSentAt: Date | null }) =>
      c.heartSent && c.heartSentAt?.toISOString().slice(0, 10) === today;
    return connections.map((c) => ({
      ...c,
      ...(chainState(c) || {}),
      heartSent: !!sentToday(c),
      heartReceived: incoming.some(
        (p) =>
          p.userId === c.partnerId &&
          p.userCommitmentId === c.partnerCommitmentId &&
          p.partnerCommitmentId === c.userCommitmentId &&
          sentToday(p),
      ),
    }));
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

  async sendHeart(userId: string, connectionId: string) {
    const connection = await this.prisma.chainConnection.findUnique({
      where: { id: connectionId, userId },
    });

    if (!connection) throw new NotFoundException('Connection not found');
    if (connection.status === ChainStatus.DISCONNECTED)
      throw new BadRequestException('This chain has been disconnected');

    const today = new Date();
    const sentToday =
      connection.heartSent &&
      connection.heartSentAt?.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);

    return this.prisma.chainConnection.update({
      where: { id: connectionId },
      data: { heartSent: !sentToday, heartSentAt: sentToday ? null : today },
    });
  }

  async sendNudge(userId: string, connectionId: string) {
    const connection = await this.prisma.chainConnection.findUnique({
      where: { id: connectionId, userId },
      include: { partnerCommitment: true },
    });

    if (!connection) throw new NotFoundException('Connection not found');
    const status = chainState(connection)?.status ?? connection.status;
    if (status !== ChainStatus.FADING && status !== ChainStatus.COMPLETED) {
      throw new BadRequestException('Can only nudge when partner is fading or completed');
    }

    // Rate limit: 1 nudge per 24 hours
    if (connection.lastNudgeSentAt) {
      const hoursSinceNudge =
        (new Date().getTime() - connection.lastNudgeSentAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceNudge < 24) {
        throw new BadRequestException('You can only send a nudge once every 24 hours');
      }
    }

    return this.prisma.chainConnection.update({
      where: { id: connectionId },
      data: { lastNudgeSentAt: new Date() },
    });
  }

  async disconnect(userId: string, connectionId: string) {
    const connection = await this.prisma.chainConnection.findUnique({
      where: { id: connectionId, userId },
    });

    if (!connection) throw new NotFoundException('Connection not found');

    return this.prisma.$transaction(async (prisma) => {
      // Disconnect user side
      await prisma.chainConnection.update({
        where: { id: connectionId },
        data: { status: ChainStatus.DISCONNECTED },
      });

      // Find and disconnect partner side
      const partnerConnection = await prisma.chainConnection.findFirst({
        where: {
          userId: connection.partnerId,
          partnerId: userId,
          userCommitmentId: connection.partnerCommitmentId,
          partnerCommitmentId: connection.userCommitmentId,
        },
      });

      if (partnerConnection) {
        await prisma.chainConnection.update({
          where: { id: partnerConnection.id },
          data: { status: ChainStatus.DISCONNECTED },
        });
      }
      return { ...connection, status: ChainStatus.DISCONNECTED };
    });
  }
}
