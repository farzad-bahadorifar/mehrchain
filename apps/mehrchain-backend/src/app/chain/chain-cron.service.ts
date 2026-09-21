import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ChainStatus } from '@prisma/client';

@Injectable()
export class ChainCronService {
  private readonly logger = new Logger(ChainCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Daily midnight check: evaluate chain connections for missed days.
   *
   * Rules from chain_feature_spec.md:
   * - 1 day missed  → RESTING
   * - 2 days missed → FADING (nudge window opens)
   * - 3+ days missed → DORMANT (auto-archived)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyChainFreeze() {
    this.logger.log('Running daily chain freeze check...');

    const activeConnections = await this.prisma.chainConnection.findMany({
      where: {
        status: { in: [ChainStatus.ACTIVE, ChainStatus.RESTING, ChainStatus.FADING] },
      },
      include: {
        partnerCommitment: { select: { lastCompletedDate: true } },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let updatedCount = 0;

    for (const connection of activeConnections) {
      const lastCompleted = connection.partnerCommitment.lastCompletedDate;

      // Check if partner completed yesterday
      const completedYesterday =
        lastCompleted && lastCompleted >= yesterday && lastCompleted < today;

      if (completedYesterday) {
        // Partner completed — reset missed days and ensure ACTIVE status
        if (connection.consecutiveMissedDays > 0 || connection.status !== ChainStatus.ACTIVE) {
          await this.prisma.chainConnection.update({
            where: { id: connection.id },
            data: {
              consecutiveMissedDays: 0,
              status: ChainStatus.ACTIVE,
              heartSent: false, // Reset daily heart
            },
          });
          updatedCount++;
        }
      } else {
        // Partner did NOT complete yesterday — increment missed days
        const newMissedDays = connection.consecutiveMissedDays + 1;
        let newStatus: ChainStatus;

        if (newMissedDays === 1) {
          newStatus = ChainStatus.RESTING;
        } else if (newMissedDays === 2) {
          newStatus = ChainStatus.FADING;
        } else {
          newStatus = ChainStatus.DORMANT;
        }

        await this.prisma.chainConnection.update({
          where: { id: connection.id },
          data: {
            consecutiveMissedDays: newMissedDays,
            status: newStatus,
            ...(newStatus === ChainStatus.DORMANT ? { archivedAt: new Date() } : {}),
          },
        });
        updatedCount++;
      }
    }

    this.logger.log(`Daily chain freeze check complete. Updated ${updatedCount} connections.`);
  }
}
