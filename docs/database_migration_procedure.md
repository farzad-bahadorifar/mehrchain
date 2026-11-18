# MehrChain database migration procedure

Updated October 5, 2026 for #47 and #52. No production schema was changed in this work session.

## October 6 release execution

The actual Render target was privately matched to `mehrchain-db` production in Neon. It was empty (no public tables), unlike the older local `.env` target described below. A pre-change Neon snapshot and a private JSON backup were captured. The empty-database baseline and the new `20261006000000_daily_chain_hearts` migration were rehearsed on a disposable branch, including a second deploy and zero-drift verification. Production was then initialized with this chain; repeat deploy and schema diff both succeeded. The snapshot remains unchanged; a temporary child was connected and verified to reproduce the original empty state. This is an empty-database recovery exercise, not evidence of restoring a populated database or switching a live backend during an outage.

For a **populated legacy target**, the October 5 procedure below must also account for the new nullable `chain_connections.heartSentAt` column. Before its zero-drift/baseline checks, execute the reviewed daily-hearts SQL as an additive patch. After resolving the release baseline, explicitly record `20261006000000_daily_chain_hearts` as applied with Prisma against the prepared `.release-prisma/schema.prisma`, using its real checksum, before deploy. Do not replay an already applied ADD COLUMN or edit either applied migration file. Rehearse this expanded legacy procedure against a populated disposable copy first; it was not used for the empty Render target.

## Verified state (read-only)

The database referenced by the local `.env` contains users (4), commitments (8), commitment_logs (13), chain_connections (0), chain_invites (0), and `_prisma_migrations`. All eight existing ownership foreign keys cascade. This confirms this connection's schema, not that Render currently uses the same database.

`prisma migrate diff` against the current canonical schema found exactly:

- `users.name` must allow NULL.
- Add cascade foreign keys for `chain_invites.acceptedById` and `acceptedCommitmentId`.

The old `20261004210000_production_baseline` history record has a checksum that does not match its SQL file. The former safe-migrate script hashed the migration name and inserted history itself. It has been replaced by a **backup-only** script. Do not use historical `init-db.js`, `migrate-neon.js`, or ordinary `prisma migrate deploy` against the old migrations directory for this release.

## Release migration chain

### November 18 Chain completion acknowledgement

The additive release migration `20261118180000_chain_heart_completion` preserves
existing daily allowances and timestamps; historical rows keep a null event ID.
The production API now requires the new column to start. Verify the serving
target privately, back up and rehearse on a disposable copy, then use the release
wrapper to apply the schema before deploying the new API and frontend. See the
[rollout and compatibility notes](../openspec/changes/update-chain-completion-support/design.md).
Do not run the legacy migration directory or infer historical completion IDs.

### October 21 optional usernames and password access addition

T17 prepares `20261021000000_optional_usernames`, after T06. It makes usernames
nullable, preserves original names with legacy provenance, adds password/session
state and a separate recovery-challenge table. A case-insensitive unique index
rejects atomic collisions; pre-existing mixed-case collisions fail the migration
for explicit review. No historical username, password hash or ownership key is
rewritten. A populated disposable-copy rehearsal succeeded; production remains
on the T05/T06 schema from the [T12 execution](t12_release_execution_2026-10-21.md).
Use a fresh snapshot/rehearsal and matching release before deploying T17. See the
[T17 handoff](t17_review_handoff.md) for compatibility, generated-client and rollback
boundaries. Do not apply T17 merely because T12's older gate succeeded.

### October 20 Mero color collection addition

T06 adds `20261020000000_mero_color_collection` after T05. It creates private
progress, named-color slots, collection-date deduplication and accepted-partner
deduplication tables. It backfills only canonical server completion dates and
persisted accepted pairs; original tables/rows are read without modification.
See the [T06 implementation/release handoff](t06_review_handoff.md) for the exact
contract, historical limits, populated-copy fixtures and rollout sequence.
No database operation, Prisma generation or rehearsal was run during implementation.
Stop old writers before this migration's snapshot/backfill boundary and deploy the
matching generated-client backend before resuming: old writers do not record reward
events. Startup adds four required-table probes. Do not replay earlier migrations,
drop earned collections on rollback or use `db push` to skip the release chain.

### October 19 private disconnect receipts addition

T05 adds `20261019000000_chain_disconnect_receipts` after the October 18
allowance ledger. It backfills a new connection generation token from each row ID
and creates recipient-scoped durable receipts with account-deletion cascades.
See the [T05 migration and review handoff](t05_review_handoff.md). No database
operation or rehearsal was run during implementation. Stop old writers before
applying this addition: old creates omit the required token and old disconnects
cannot save reasons. Regenerate Prisma Client and deploy matching code; the
updated startup probes require this schema. Preserve earlier migration files.

### October 18 quiet-heart allowance addition

T04 adds `20261018000000_idempotent_chain_hearts` after the account calendar and
habit lifecycle migrations. It creates the unique sender/recipient-habit/day
allowance ledger and backfills persisted heart timestamps in the recipient zone,
collapsing duplicate links without changing existing fields. See the
[T04 populated-copy and recovery handoff](t04_review_handoff.md).
No migration, database operation or rehearsal was run during T04 implementation.
Stop old toggle writers during rollout, verify the composite primary key,
backfill and cascades, regenerate Prisma Client and deploy matching code. The
production readiness probe now also requires the ledger columns; it does not
verify migration history or the unique constraint itself.

### October 17 account calendar and lifecycle additions

The baseline remains the October 5 schema; it is not regenerated when the
canonical schema changes. Current `main` also requires the additive release
migrations `20261017000000_account_calendar` and
`20261017100000_habit_lifecycle`, after October 6 daily hearts. See the
[T00 release sequence](t00_review_handoff.md) and
[T02 populated-copy preservation checks](t02_review_handoff.md).
These additions have not been rehearsed/applied by the T00 implementation.

For an already release-baselined target, review all pending SQL, back up, rehearse
and use the release wrapper before building/deploying the matching backend.
Production startup now refuses readiness when required calendar/lifecycle
columns are missing; it does not migrate the database automatically.

The legacy procedure below describes the earlier schema. Its zero-drift checks
now compare against the expanded canonical schema. A legacy adoption rehearsal
must account for all later additive SQL and record each already-applied release
migration through Prisma with its real checksum before deploy. Do not mark only
the baseline and then replay later ADD COLUMN statements that have already been
applied. Stop if the inspected target/history does not match the chosen path.

### Isolated chain and historical audit

`prisma/release-migrations/20261005000000_release_baseline/migration.sql` is the full October 5 baseline. The wrapper copies the canonical schema and this isolated chain into ignored `.release-prisma/` and invokes Prisma. It replaces the prepared migration directory each time to avoid retaining files from another revision. Historical migrations remain unchanged for audit. Future migrations belong in `release-migrations` and must be generated/reviewed against a disposable database; never regenerate or edit an applied release baseline.

The old chain is not replayable: the first two migrations create then drop the old Commitment table; the October baseline recreates Category and does not upgrade an existing commitments table. The new chain avoids replaying those operations. `deploy` is only for an empty database or one already baselined through the procedure below.

## Existing database: exact operator steps

1. Privately compare Render's DATABASE_URL target with the database audited above. Export the **direct** Neon branch connection as DATABASE_URL in the operator shell. Never print or commit the URL. Install dependencies with `npm ci --legacy-peer-deps`.
2. Create a Neon recovery branch/snapshot in the console and record its identifier/time privately. Run `node scripts/safe-migrate.js` for a consistent read-only data export to ignored `docs/backups/`. The JSON contains personal data and password hashes; keep it private. A JSON export supplements a restorable Neon snapshot; it is not a complete schema restore.
3. Capture before-counts, inspect the SQL below and check accepted IDs for orphans. Current invites are empty; recheck at execution time. If orphan IDs exist, stop and agree on recovery instead of deleting them automatically.
4. Apply only the reviewed additive patch, **not** the full CREATE baseline:

   ```powershell
   npx prisma db execute --schema apps/mehrchain-backend/prisma/schema.prisma --file apps/mehrchain-backend/prisma/migrations/20261005090000_invite_acceptance_cascades/migration.sql
   ```

   This patch is transactional. Repeating it is unnecessary: inspect constraints first; if already applied, skip it.

5. Re-run the read-only diff. It must be empty, and all row counts unchanged:

   ```powershell
   npx prisma migrate diff --from-schema-datasource apps/mehrchain-backend/prisma/schema.prisma --to-schema-datamodel apps/mehrchain-backend/prisma/schema.prisma --exit-code
   ```

6. Record the new baseline with Prisma's real file checksum, only after step 5 succeeds:

   ```powershell
   $env:BASELINE_SCHEMA_VERIFIED='yes'
   node scripts/release-migrate.cjs resolve-baseline
   node scripts/release-migrate.cjs status
   node scripts/release-migrate.cjs deploy
   ```

   The wrapper also checks zero schema drift before resolving. Do not delete or manually rewrite the legacy history row. The new release chain is explicitly baselined under a different name; keep the old checksum discrepancy in the audit record. A second deploy should report no pending migrations and preserve all rows.

7. Generate Prisma Client, build, then deploy the backend. Render's build runs generation/build without destructive db push. Apply schema migrations explicitly before deployment; Render free-plan startup is not a migration runner.

## Empty disposable database

Set DATABASE_URL to a genuinely empty disposable branch, run `node scripts/release-migrate.cjs deploy` twice, then the zero-drift diff and release smoke. The baseline creates all tables/relationships including acceptance cascades. Do **not** run resolve-baseline on an empty database. This fresh-database execution still needs to be performed; SQL generation and Prisma validation alone do not prove replay safety.

## Recovery

Stop writes and redeployment if migration verification fails. Restore the pre-migration Neon recovery branch/snapshot, verify row counts and ownership, point the backend at the restored branch, and redeploy the last compatible backend. Do not run migrate reset or data-loss db push. Test this recovery procedure on a disposable branch before claiming the release foundation complete.
