-- CreateEnum
CREATE TYPE "Category" AS ENUM ('health', 'growth', 'community', 'environment');

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "why" TEXT,
    "totalDays" INTEGER NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCompletedDate" TIMESTAMP(3),
    "rippleEffects" TEXT[],
    "history" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);
