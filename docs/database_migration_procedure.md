# MehrChain — Production Database Migration & Safe Deployment Procedure

> Documented for Task R1 (#47) — October 4, 2026

---

## 1. Schema Baseline State

As verified against Neon PostgreSQL on October 4, 2026:

| Table | Status | Records | Foreign Keys / Cascades |
|-------|--------|:-------:|-------------------------|
| `users` | ✅ Verified | 4 | Primary key (`id`), unique email & username |
| `commitments` | ✅ Verified | 8 | `userId` -> `users(id)` ON DELETE CASCADE |
| `commitment_logs` | ✅ Verified | 13 | `commitmentId` -> `commitments(id)` ON DELETE CASCADE |
| `chain_connections` | ✅ Verified | 0 | `userId` & `partnerId` -> `users(id)` ON DELETE CASCADE<br>`userCommitmentId` & `partnerCommitmentId` -> `commitments(id)` ON DELETE CASCADE |
| `chain_invites` | ✅ Verified | 0 | `senderId` -> `users(id)` ON DELETE CASCADE<br>`senderCommitmentId` -> `commitments(id)` ON DELETE CASCADE |
| `_prisma_migrations` | ✅ Active | 1 | Baseline record: `20261004210000_production_baseline` |

---

## 2. Safe Deployment Protocol

### Render Build Command
The destructive command `prisma db push --accept-data-loss` has been permanently removed from `render.yaml`. The current build command is:

```bash
npm ci && npx prisma generate --schema=apps/mehrchain-backend/prisma/schema.prisma && NX_DAEMON=false npx nx build mehrchain-backend
```

### Migration Execution
1. Migrations are strictly additive and idempotent.
2. Before applying schema changes, create a snapshot of table data:
   ```bash
   node scripts/safe-migrate.js
   ```
3. The script automatically exports JSON backups to `docs/backups/neon-backup-<timestamp>.json` prior to executing any DDL.

---

## 3. Rollback & Restore Procedure

If any deployment or schema modification fails or corrupts data:

1. **Locate Backup Snapshot**: Find the latest pre-migration backup in `docs/backups/neon-backup-<timestamp>.json`.
2. **Restore Command**:
   A restore script can read the backup JSON and re-insert records using `ON CONFLICT (id) DO UPDATE`.
3. **Database Rollback (Neon Branching / Point-in-Time Restore)**:
   Neon provides instant point-in-time restore and branching directly in the Neon console. If severe schema corruption occurs, restore the branch to the exact timestamp prior to the migration.
