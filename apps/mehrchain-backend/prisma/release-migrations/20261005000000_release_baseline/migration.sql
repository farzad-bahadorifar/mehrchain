-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('health', 'growth', 'community', 'environment');

-- CreateEnum
CREATE TYPE "ChainStatus" AS ENUM ('ACTIVE', 'RESTING', 'FADING', 'COMPLETED', 'DORMANT', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "ChainInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
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

-- CreateTable
CREATE TABLE "commitments" (
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

-- CreateTable
CREATE TABLE "commitment_logs" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "metadata" JSONB,

    CONSTRAINT "commitment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_connections" (
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

-- CreateTable
CREATE TABLE "chain_invites" (
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "commitments_userId_idx" ON "commitments"("userId");

-- CreateIndex
CREATE INDEX "commitment_logs_commitmentId_idx" ON "commitment_logs"("commitmentId");

-- CreateIndex
CREATE UNIQUE INDEX "chain_connections_userId_partnerId_userCommitmentId_key" ON "chain_connections"("userId", "partnerId", "userCommitmentId");

-- CreateIndex
CREATE UNIQUE INDEX "chain_invites_inviteCode_key" ON "chain_invites"("inviteCode");

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitment_logs" ADD CONSTRAINT "commitment_logs_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_connections" ADD CONSTRAINT "chain_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_connections" ADD CONSTRAINT "chain_connections_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_connections" ADD CONSTRAINT "chain_connections_userCommitmentId_fkey" FOREIGN KEY ("userCommitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_connections" ADD CONSTRAINT "chain_connections_partnerCommitmentId_fkey" FOREIGN KEY ("partnerCommitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_invites" ADD CONSTRAINT "chain_invites_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_invites" ADD CONSTRAINT "chain_invites_senderCommitmentId_fkey" FOREIGN KEY ("senderCommitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_invites" ADD CONSTRAINT "chain_invites_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_invites" ADD CONSTRAINT "chain_invites_acceptedCommitmentId_fkey" FOREIGN KEY ("acceptedCommitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
