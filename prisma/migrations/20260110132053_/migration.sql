/*
  Warnings:

  - You are about to drop the column `userId` on the `Coordinator` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Coordinator" DROP CONSTRAINT "Coordinator_userId_fkey";

-- DropIndex
DROP INDEX "Coordinator_userId_key";

-- AlterTable
ALTER TABLE "Advisor" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Coordinator" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "Coordinator" ADD CONSTRAINT "Coordinator_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
