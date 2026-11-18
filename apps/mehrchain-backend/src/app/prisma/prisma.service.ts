import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    if (process.env['NODE_ENV'] === 'production') {
      try {
        // Read no account data. Refuse to serve the new contract against a
        // database missing the calendar/lifecycle columns in this revision.
        await this.$queryRaw`SELECT "timeZone" FROM "users" LIMIT 0`;
        await this.$queryRaw`SELECT "dayKey", "timeZone" FROM "commitment_logs" LIMIT 0`;
        await this.$queryRaw`SELECT "inactivityAnchorAt" FROM "commitments" LIMIT 0`;
        await this
          .$queryRaw`SELECT "senderId", "recipientCommitmentId", "dayKey", "sentAt", "completionId" FROM "chain_hearts" LIMIT 0`;
        await this.$queryRaw`SELECT "generationId" FROM "chain_connections" LIMIT 0`;
        await this
          .$queryRaw`SELECT "recipientId", "partnerId", "recipientConnectionId", "generationId", "recipientHabitTitle", "reason", "note", "createdAt", "readAt" FROM "chain_disconnect_receipts" LIMIT 0`;
        await this
          .$queryRaw`SELECT "userId", "unlockedAt", "unlockedDayKey", "collectionDays", "acceptedPartners", "selectedSlot", "preferencesInitialized", "hasSentSupport" FROM "mero_progress" LIMIT 0`;
        await this.$queryRaw`SELECT "userId", "slot", "name", "hex" FROM "mero_colors" LIMIT 0`;
        await this.$queryRaw`SELECT "userId", "dayKey" FROM "mero_collection_days" LIMIT 0`;
        await this.$queryRaw`SELECT "userId", "partnerId" FROM "mero_accepted_partners" LIMIT 0`;
        await this
          .$queryRaw`SELECT "usernameSource", "passwordSetAt", "authVersion" FROM "users" LIMIT 0`;
        await this
          .$queryRaw`SELECT "userId", "codeHash", "expiresAt", "requestedAt", "attempts" FROM "password_resets" LIMIT 0`;
      } catch {
        await this.$disconnect();
        throw new Error(
          'Database readiness check failed. Verify DATABASE_URL and apply the reviewed release migrations before deployment; see docs/database_migration_procedure.md.',
        );
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
