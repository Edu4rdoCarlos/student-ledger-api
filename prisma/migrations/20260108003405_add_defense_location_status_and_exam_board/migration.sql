-- CreateEnum
CREATE TYPE "DefenseStatus" AS ENUM ('SCHEDULED', 'CANCELED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Defense" ADD COLUMN     "location" TEXT,
ADD COLUMN     "status" "DefenseStatus" NOT NULL DEFAULT 'SCHEDULED';

-- CreateTable
CREATE TABLE "ExamBoardMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defenseId" TEXT NOT NULL,

    CONSTRAINT "ExamBoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamBoardMember_defenseId_idx" ON "ExamBoardMember"("defenseId");

-- CreateIndex
CREATE INDEX "ExamBoardMember_email_idx" ON "ExamBoardMember"("email");

-- CreateIndex
CREATE INDEX "Defense_status_idx" ON "Defense"("status");

-- AddForeignKey
ALTER TABLE "ExamBoardMember" ADD CONSTRAINT "ExamBoardMember_defenseId_fkey" FOREIGN KEY ("defenseId") REFERENCES "Defense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
