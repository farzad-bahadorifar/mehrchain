/*
  Warnings:

  - You are about to drop the `Commitment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Commitment";

-- CreateTable
CREATE TABLE "commitments" (
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

    CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);
