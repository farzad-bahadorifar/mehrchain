import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ChainStatus, ChainInviteStatus } from '@prisma/client';

@Injectable()
export class ChainService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvite(userId: string, dto: CreateInviteDto) {
    const commitment = await this.prisma.commitment.findUnique({
      where: { id: dto.commitmentId, userId },
    });

    if (!commitment) throw new NotFoundException('Commitment not found');
    if (!commitment.isPublic) throw new BadRequestException('Commitment must be public to create an invite');

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
        senderCommitment: { select: { title: true, category: true } },
      },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== ChainInviteStatus.PENDING) throw new BadRequestException('Invite is not pending');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite has expired');

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

    // Start a transaction to accept invite and create two-way connection
    return this.prisma.$transaction(async (prisma) => {
      // 1. Update invite status
      await prisma.chainInvite.update({
        where: { id: invite.id },
        data: {
          status: ChainInviteStatus.ACCEPTED,
          acceptedById: userId,
          acceptedCommitmentId: dto.commitmentId,
        },
      });

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
    });
  }

  async getConnections(userId: string) {
    return this.prisma.chainConnection.findMany({
      where: { userId },
      include: {
        partner: { select: { username: true, name: true } },
        partnerCommitment: { select: { title: true, category: true, consecutiveMissedDays: true } },
      },
      orderBy: { lastPartnerActivityAt: 'desc' },
    });
  }

  async sendHeart(userId: string, connectionId: string) {
    const connection = await this.prisma.chainConnection.findUnique({
      where: { id: connectionId, userId },
    });
    
    if (!connection) throw new NotFoundException('Connection not found');
    
    return this.prisma.chainConnection.update({
      where: { id: connectionId },
      data: { heartSent: !connection.heartSent }, // toggle
    });
  }

  async sendNudge(userId: string, connectionId: string) {
    const connection = await this.prisma.chainConnection.findUnique({
      where: { id: connectionId, userId },
    });
    
    if (!connection) throw new NotFoundException('Connection not found');
    if (connection.status !== ChainStatus.FADING && connection.status !== ChainStatus.COMPLETED) {
      throw new BadRequestException('Can only nudge when partner is fading or completed');
    }

    // Rate limit: 1 nudge per 24 hours
    if (connection.lastNudgeSentAt) {
      const hoursSinceNudge = (new Date().getTime() - connection.lastNudgeSentAt.getTime()) / (1000 * 60 * 60);
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
        },
      });

      if (partnerConnection) {
        await prisma.chainConnection.update({
          where: { id: partnerConnection.id },
          data: { status: ChainStatus.DISCONNECTED },
        });
      }
    });
  }
}
