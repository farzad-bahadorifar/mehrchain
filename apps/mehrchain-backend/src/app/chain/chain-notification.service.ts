import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChainStatus } from '@prisma/client';

/**
 * Thin notification service responsible for propagating habit completion events
 * to all linked ChainConnection records.
 *
 * Kept separate from ChainService to avoid circular dependency with CommitmentsModule.
 */
@Injectable()
export class ChainNotificationService {
  private readonly logger = new Logger(ChainNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates `lastPartnerActivityAt` for all active chain connections where the
   * given commitment is the user's linked habit. Called automatically when a
   * user completes their habit.
   *
   * Only notifies ACTIVE, RESTING, and FADING connections.
   * DORMANT, DISCONNECTED, and COMPLETED connections are intentionally skipped.
   *
   * @param commitmentId - The commitment that was just completed.
   */
  async notifyChainPartners(commitmentId: string): Promise<void> {
    try {
      const result = await this.prisma.chainConnection.updateMany({
        where: {
          userCommitmentId: commitmentId,
          status: {
            in: [ChainStatus.ACTIVE, ChainStatus.RESTING, ChainStatus.FADING],
          },
        },
        data: {
          lastPartnerActivityAt: new Date(),
        },
      });

      if (result.count > 0) {
        this.logger.debug(
          `Auto-notified ${result.count} chain connection(s) for commitment ${commitmentId}`,
        );
      }
    } catch (error) {
      // Log but do not rethrow — chain notification failure must never block
      // the habit completion response.
      this.logger.error(
        `Failed to notify chain partners for commitment ${commitmentId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
