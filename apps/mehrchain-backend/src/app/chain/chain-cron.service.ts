import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ChainStatus } from '@prisma/client';
import { chainState } from './chain-state';

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
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
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

    let updatedCount = 0;
    for (const connection of activeConnections) {
      const state = chainState(connection);
      if (
        !state ||
        (state.status === connection.status &&
          state.consecutiveMissedDays === connection.consecutiveMissedDays)
      )
        continue;
      await this.prisma.chainConnection.update({
        where: { id: connection.id },
        data: {
          ...state,
          ...(state.status === ChainStatus.DORMANT ? { archivedAt: new Date() } : {}),
        },
      });
      updatedCount++;
    }
    this.logger.log(`Daily chain freeze check complete. Updated ${updatedCount} connections.`);
  }
}
