import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';

@Injectable()
export class CommitmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCommitments(userId: string) {
    const commitments = await this.prisma.commitment.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        logs: {
          orderBy: { completedAt: 'desc' },
          take: 14,
        },
      },
    });

    const todayStr = new Date().toDateString();

    return commitments.map((c) => {
      const isCompletedToday = c.lastCompletedDate
        ? new Date(c.lastCompletedDate).toDateString() === todayStr
        : false;

      return {
        ...c,
        isCompletedToday,
      };
    });
  }

  async createCommitment(userId: string, dto: CreateCommitmentDto) {
    return this.prisma.commitment.create({
      data: {
        userId,
        title: dto.title.trim(),
        category: dto.category,
        why: dto.why?.trim(),
        totalDays: dto.totalDays,
        currentDay: 0,
        currentStreak: 0,
        reminderTime: dto.reminderTime,
        history: [],
      },
    });
  }

  async completeCommitment(userId: string, commitmentId: string, note?: string) {
    const commitment = await this.prisma.commitment.findUnique({
      where: { id: commitmentId },
    });

    if (!commitment) {
      throw new NotFoundException('Commitment not found.');
    }

    if (commitment.userId !== userId) {
      throw new ForbiddenException('Access denied to this commitment.');
    }

    const today = new Date();
    const todayStr = today.toDateString();

    const alreadyDone = commitment.lastCompletedDate
      ? new Date(commitment.lastCompletedDate).toDateString() === todayStr
      : false;

    if (alreadyDone) {
      return commitment;
    }

    // Create persistent activity log
    await this.prisma.commitmentLog.create({
      data: {
        commitmentId: commitment.id,
        completedAt: today,
        note: note?.trim(),
      },
    });

    // Update streak and current day
    const updated = await this.prisma.commitment.update({
      where: { id: commitment.id },
      data: {
        currentStreak: { increment: 1 },
        currentDay: Math.min(commitment.currentDay + 1, commitment.totalDays),
        lastCompletedDate: today,
        history: { push: todayStr },
      },
    });

    return {
      ...updated,
      isCompletedToday: true,
    };
  }

  async updateCommitment(userId: string, commitmentId: string, dto: UpdateCommitmentDto) {
    const commitment = await this.prisma.commitment.findUnique({
      where: { id: commitmentId },
    });

    if (!commitment) {
      throw new NotFoundException('Commitment not found.');
    }

    if (commitment.userId !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    return this.prisma.commitment.update({
      where: { id: commitmentId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.why !== undefined && { why: dto.why?.trim() }),
        ...(dto.totalDays !== undefined && { totalDays: dto.totalDays }),
        ...(dto.reminderTime !== undefined && { reminderTime: dto.reminderTime }),
      },
    });
  }

  async deleteCommitment(userId: string, commitmentId: string) {
    const commitment = await this.prisma.commitment.findUnique({
      where: { id: commitmentId },
    });

    if (!commitment) {
      throw new NotFoundException('Commitment not found.');
    }

    if (commitment.userId !== userId) {
      throw new ForbiddenException('Access denied.');
    }

    return this.prisma.commitment.update({
      where: { id: commitmentId },
      data: { isArchived: true },
    });
  }
}
