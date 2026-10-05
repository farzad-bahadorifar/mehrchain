BEGIN;
-- Fail if legacy acceptance references are orphaned; review them before applying.
-- Deleting either participant's accepted habit/account deletes its invite record.
ALTER TABLE "chain_invites" ADD CONSTRAINT "chain_invites_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chain_invites" ADD CONSTRAINT "chain_invites_acceptedCommitmentId_fkey"
  FOREIGN KEY ("acceptedCommitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Existing production users.name is NOT NULL; Google may omit a display name.
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;


COMMIT;
