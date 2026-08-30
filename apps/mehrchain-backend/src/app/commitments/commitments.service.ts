import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';

@Injectable()
export class CommitmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all active (non-archived) habit commitments for the specified user,
   * including recent completion logs and dynamic isCompletedToday flag.
   *
   * @param userId - Unique user identifier.
   * @returns Array of active user commitments with real-time completion state.
   */
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

  /**
   * Creates a new habit commitment initialized with currentDay 0 and currentStreak 0.
   *
   * @param userId - Owner user ID.
   * @param dto - New commitment parameters (title, category, duration, optional why and reminder).
   * @returns The newly created Commitment record.
   */
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

  /**
   * Records a habit completion for today. Increments currentDay, advances streak,
   * stores an immutable completion log, and prevents duplicate completions on the same calendar day.
   *
   * @param userId - Requesting user ID for ownership validation.
   * @param commitmentId - Target commitment UUID.
   * @param note - Optional personal reflection or celebration note.
   * @returns The updated commitment with isCompletedToday marked true.
   * @throws {NotFoundException} If the commitment does not exist.
   * @throws {ForbiddenException} If the commitment belongs to another user.
   */
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

  /**
   * Updates habit attributes (title, category, why reflection, target days, reminder time).
   *
   * @param userId - Owner user ID for permission check.
   * @param commitmentId - Target commitment UUID.
   * @param dto - Partial update fields.
   * @returns Updated Commitment record.
   * @throws {NotFoundException} If commitment does not exist.
   * @throws {ForbiddenException} If commitment belongs to a different user.
   */
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

  /**
   * Soft-archives a commitment by setting isArchived to true.
   * Preserves all completion history, logs, and calendar statistics.
   *
   * @param userId - Owner user ID.
   * @param commitmentId - Target commitment UUID.
   * @returns The updated commitment record marked as archived.
   * @throws {NotFoundException} If commitment does not exist.
   * @throws {ForbiddenException} If user does not have permission.
   */
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

  /**
   * Retrieves all archived commitments for the specified user.
   *
   * @param userId - Unique user identifier.
   * @returns Array of archived commitments ordered by latest updated date.
   */
  async getArchivedCommitments(userId: string) {
    const commitments = await this.prisma.commitment.findMany({
      where: {
        userId,
        isArchived: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return commitments.map((c) => ({
      ...c,
      isCompletedToday: false,
    }));
  }

  /**
   * Restores an archived commitment back to active status (isArchived = false).
   *
   * @param userId - Owner user ID.
   * @param commitmentId - Target commitment UUID.
   * @returns Restored Commitment record.
   * @throws {NotFoundException} If commitment does not exist.
   * @throws {ForbiddenException} If user does not have permission.
   */
  async restoreCommitment(userId: string, commitmentId: string) {
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
      data: { isArchived: false },
    });
  }
}
