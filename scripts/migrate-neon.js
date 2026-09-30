const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require('pg');
require('dotenv').config();

const ddl = `
CREATE SCHEMA IF NOT EXISTS "public";

DO $$ BEGIN
    CREATE TYPE "Category" AS ENUM ('health', 'growth', 'community', 'environment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ChainStatus" AS ENUM ('ACTIVE', 'RESTING', 'FADING', 'COMPLETED', 'DORMANT', 'DISCONNECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ChainInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verificationCodeExpiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "commitments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "why" TEXT,
    "totalDays" INTEGER NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "consecutiveMissedDays" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCompletedDate" TIMESTAMP(3),
    "reminderTime" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "rippleEffects" TEXT[],
    "history" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "commitment_logs" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "metadata" JSONB,
    CONSTRAINT "commitment_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chain_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "userCommitmentId" TEXT NOT NULL,
    "partnerCommitmentId" TEXT NOT NULL,
    "status" "ChainStatus" NOT NULL DEFAULT 'ACTIVE',
    "consecutiveMissedDays" INTEGER NOT NULL DEFAULT 0,
    "lastPartnerActivityAt" TIMESTAMP(3),
    "lastNudgeSentAt" TIMESTAMP(3),
    "heartSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),
    CONSTRAINT "chain_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chain_invites" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderCommitmentId" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "status" "ChainInviteStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedById" TEXT,
    "acceptedCommitmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chain_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");
CREATE INDEX IF NOT EXISTS "commitments_userId_idx" ON "commitments"("userId");
CREATE INDEX IF NOT EXISTS "commitment_logs_commitmentId_idx" ON "commitment_logs"("commitmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "chain_connections_userId_partnerId_userCommitmentId_key" ON "chain_connections"("userId", "partnerId", "userCommitmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "chain_invites_inviteCode_key" ON "chain_invites"("inviteCode");
`;

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected to Neon PostgreSQL!');
  
  // 1. Add username to users table if missing
  await client.query(`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
    UPDATE "users" SET "username" = LOWER(SPLIT_PART("email", '@', 1)) WHERE "username" IS NULL;
    ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
    CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");
  `);
  console.log('Updated users table with username!');

  // 2. Add Chain columns to commitments table
  await client.query(`
    ALTER TABLE "commitments" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE "commitments" ADD COLUMN IF NOT EXISTS "consecutiveMissedDays" INTEGER NOT NULL DEFAULT 0;
  `);
  console.log('Updated commitments table!');

  // 3. Create Enums and Chain tables
  await client.query(`
    DO $$ BEGIN
        CREATE TYPE "ChainStatus" AS ENUM ('ACTIVE', 'RESTING', 'FADING', 'COMPLETED', 'DORMANT', 'DISCONNECTED');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE TYPE "ChainInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "chain_connections" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "partnerId" TEXT NOT NULL,
        "userCommitmentId" TEXT NOT NULL,
        "partnerCommitmentId" TEXT NOT NULL,
        "status" "ChainStatus" NOT NULL DEFAULT 'ACTIVE',
        "consecutiveMissedDays" INTEGER NOT NULL DEFAULT 0,
        "lastPartnerActivityAt" TIMESTAMP(3),
        "lastNudgeSentAt" TIMESTAMP(3),
        "heartSent" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "archivedAt" TIMESTAMP(3),
        CONSTRAINT "chain_connections_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE IF NOT EXISTS "chain_invites" (
        "id" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "senderCommitmentId" TEXT NOT NULL,
        "inviteCode" TEXT NOT NULL,
        "status" "ChainInviteStatus" NOT NULL DEFAULT 'PENDING',
        "acceptedById" TEXT,
        "acceptedCommitmentId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "chain_invites_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "chain_connections_userId_partnerId_userCommitmentId_key" ON "chain_connections"("userId", "partnerId", "userCommitmentId");
    CREATE UNIQUE INDEX IF NOT EXISTS "chain_invites_inviteCode_key" ON "chain_invites"("inviteCode");
  `);
  console.log('Created Chain tables successfully!');

  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log('All tables now in Neon DB:', tables.rows.map(r => r.table_name));

  await client.end();
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
