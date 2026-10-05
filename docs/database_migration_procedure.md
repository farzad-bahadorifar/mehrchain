# MehrChain database migration procedure

Updated October 5, 2026 for #47 and #52. No production schema was changed in this work session.

## Verified state (read-only)

The database referenced by the local `.env` contains users (4), commitments (8), commitment_logs (13), chain_connections (0), chain_invites (0), and `_prisma_migrations`. All eight existing ownership foreign keys cascade. This confirms this connection's schema, not that Render currently uses the same database.

`prisma migrate diff` against the current canonical schema found exactly:

- `users.name` must allow NULL.
- Add cascade foreign keys for `chain_invites.acceptedById` and `acceptedCommitmentId`.

The old `20261004210000_production_baseline` history record has a checksum that does not match its SQL file. The former safe-migrate script hashed the migration name and inserted history itself. It has been replaced by a **backup-only** script. Do not use historical `init-db.js`, `migrate-neon.js`, or ordinary `prisma migrate deploy` against the old migrations directory for this release.

## Release migration chain

`prisma/release-migrations/20261005000000_release_baseline/migration.sql` is a full baseline generated from the current schema. The wrapper copies the canonical schema and this isolated chain into ignored `.release-prisma/` and invokes Prisma. Historical migrations remain unchanged for audit. Future migrations belong in `release-migrations` and must be generated/reviewed against a disposable database; never regenerate or edit an applied release baseline.

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
