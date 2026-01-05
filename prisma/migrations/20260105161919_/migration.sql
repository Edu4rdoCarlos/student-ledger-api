/*
  Warnings:

  - You are about to drop the column `code` on the `Approval` table. All the data in the column will be lost.
  - You are about to drop the column `codeExpiresAt` on the `Approval` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Approval" DROP COLUMN "code",
DROP COLUMN "codeExpiresAt";
