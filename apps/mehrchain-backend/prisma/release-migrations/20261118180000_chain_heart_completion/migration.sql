BEGIN;

ALTER TABLE "chain_hearts" ADD COLUMN "completionId" TEXT;
CREATE UNIQUE INDEX "chain_hearts_senderId_recipientCommitmentId_completionId_key"
  ON "chain_hearts" ("senderId", "recipientCommitmentId", "completionId");
CREATE INDEX "commitment_logs_commitmentId_completedAt_idx"
  ON "commitment_logs" ("commitmentId", "completedAt");

COMMIT;
