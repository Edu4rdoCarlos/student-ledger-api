/*
  Warnings:

  - A unique constraint covering the columns `[approvalId]` on the table `UserCertificate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserCertificate_userId_status_key";

-- AlterTable
ALTER TABLE "UserCertificate" ADD COLUMN     "approvalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserCertificate_approvalId_key" ON "UserCertificate"("approvalId");

-- CreateIndex
CREATE INDEX "UserCertificate_approvalId_idx" ON "UserCertificate"("approvalId");

-- AddForeignKey
ALTER TABLE "UserCertificate" ADD CONSTRAINT "UserCertificate_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval"("id") ON DELETE SET NULL ON UPDATE CASCADE;
