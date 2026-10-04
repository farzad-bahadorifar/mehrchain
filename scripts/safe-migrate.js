/**
 * Safe, repeatable database migration for MehrChain
 * - Backs up data before any change
 * - Adds missing foreign key constraints idempotently
 * - Creates _prisma_migrations and records the production baseline
 * - Verifies schema and data integrity
 */

const dns = require('dns').promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const dbUrl = new URL(process.env.DATABASE_URL);
  const hostname = dbUrl.hostname;
  const ips = await dns.resolve4(hostname);
  let client;
  let lastErr;
  for (const ip of ips) {
    try {
      client = new Client({
        host: ip,
        port: parseInt(dbUrl.port || '5432', 10),
        user: decodeURIComponent(dbUrl.username),
        password: decodeURIComponent(dbUrl.password),
        database: dbUrl.pathname.replace(/^\//, ''),
        ssl: { rejectUnauthorized: false, servername: hostname },
        connectionTimeoutMillis: 15000,
      });
      await client.connect();
      console.log(`Connected to Neon PostgreSQL via ${ip}.`);
      break;
    } catch (e) {
      lastErr = e;
      client = null;
    }
  }

  if (!client) {
    throw new Error(`Failed to connect to any Neon IP: ${lastErr?.message}`);
  }

  // ==========================================
  // Step 1: Pre-Migration Backup
  // ==========================================
  console.log('\n--- Step 1: Creating Pre-Migration Backup ---');
  const tables = ['users', 'commitments', 'commitment_logs', 'chain_connections', 'chain_invites'];
  const backupData = {
    timestamp: new Date().toISOString(),
    records: {},
  };

  for (const table of tables) {
    const res = await client.query(`SELECT * FROM "${table}"`);
    backupData.records[table] = res.rows;
    console.log(`Backed up ${table}: ${res.rows.length} rows`);
  }

  const backupDir = path.join(__dirname, '..', 'docs', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `neon-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`Backup saved to: ${backupFile}`);

  // ==========================================
  // Step 2: Additive Migration (Idempotent)
  // ==========================================
  console.log('\n--- Step 2: Applying Safe Additive Schema Changes ---');

  // 2.1 Foreign keys for chain_connections
  const fkStatements = [
    {
      name: 'chain_connections_userId_fkey',
      table: 'chain_connections',
      sql: `ALTER TABLE "chain_connections" 
            ADD CONSTRAINT "chain_connections_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    },
    {
      name: 'chain_connections_partnerId_fkey',
      table: 'chain_connections',
      sql: `ALTER TABLE "chain_connections" 
            ADD CONSTRAINT "chain_connections_partnerId_fkey" 
            FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    },
    {
      name: 'chain_connections_userCommitmentId_fkey',
      table: 'chain_connections',
      sql: `ALTER TABLE "chain_connections" 
            ADD CONSTRAINT "chain_connections_userCommitmentId_fkey" 
            FOREIGN KEY ("userCommitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    },
    {
      name: 'chain_connections_partnerCommitmentId_fkey',
      table: 'chain_connections',
      sql: `ALTER TABLE "chain_connections" 
            ADD CONSTRAINT "chain_connections_partnerCommitmentId_fkey" 
            FOREIGN KEY ("partnerCommitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    },
    {
      name: 'chain_invites_senderId_fkey',
      table: 'chain_invites',
      sql: `ALTER TABLE "chain_invites" 
            ADD CONSTRAINT "chain_invites_senderId_fkey" 
            FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    },
    {
      name: 'chain_invites_senderCommitmentId_fkey',
      table: 'chain_invites',
      sql: `ALTER TABLE "chain_invites" 
            ADD CONSTRAINT "chain_invites_senderCommitmentId_fkey" 
            FOREIGN KEY ("senderCommitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
    },
  ];

  for (const fk of fkStatements) {
    const exists = await client.query(
      `SELECT 1 FROM information_schema.table_constraints 
       WHERE constraint_name = $1 AND table_schema = 'public'`,
      [fk.name]
    );

    if (exists.rows.length === 0) {
      console.log(`Adding foreign key: ${fk.name}...`);
      await client.query(fk.sql);
      console.log(`  Added ${fk.name}`);
    } else {
      console.log(`Foreign key already exists: ${fk.name}`);
    }
  }

  // 2.2 Baseline _prisma_migrations table
  console.log('\n--- Step 2.2: Initializing _prisma_migrations Baseline ---');
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
    );
  `);

  const migrationName = '20261004210000_production_baseline';
  const migExists = await client.query(
    `SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = $1`,
    [migrationName]
  );

  if (migExists.rows.length === 0) {
    const crypto = require('crypto');
    const id = crypto.randomUUID();
    const checksum = crypto.createHash('sha256').update(migrationName).digest('hex');
    await client.query(
      `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "applied_steps_count")
       VALUES ($1, $2, now(), $3, 'Baseline migration applied safely', 1)`,
      [id, checksum, migrationName]
    );
    console.log(`Recorded baseline migration: ${migrationName}`);
  } else {
    console.log(`Baseline migration ${migrationName} already recorded.`);
  }

  // ==========================================
  // Step 3: Verification & Data Integrity
  // ==========================================
  console.log('\n--- Step 3: Post-Migration Verification ---');

  // Verify row counts unchanged
  for (const table of tables) {
    const res = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
    const count = parseInt(res.rows[0].count, 10);
    const beforeCount = backupData.records[table].length;
    if (count !== beforeCount) {
      throw new Error(`Data count mismatch for ${table}: before=${beforeCount}, after=${count}`);
    }
    console.log(`Row count verified for ${table}: ${count} rows (no data loss)`);
  }

  // Verify foreign keys active
  const fkCheck = await client.query(`
    SELECT constraint_name, table_name 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
    ORDER BY constraint_name;
  `);
  console.log('\nAll active foreign key constraints:');
  fkCheck.rows.forEach((r) => console.log(`  - ${r.constraint_name} on ${r.table_name}`));

  await client.end();
  console.log('\nMigration completed successfully and verified safely!');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
