/*
  Warnings:

  - You are about to drop the column `mongoFileId` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "mongoFileId",
ADD COLUMN     "documentCid" VARCHAR(64);
