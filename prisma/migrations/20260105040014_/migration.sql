/*
  Warnings:

  - You are about to drop the column `userId` on the `Advisor` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Student` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Advisor" DROP CONSTRAINT "Advisor_userId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_userId_fkey";

-- DropIndex
DROP INDEX "Advisor_userId_key";

-- DropIndex
DROP INDEX "Student_userId_key";

-- AlterTable
ALTER TABLE "Advisor" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "Advisor" ADD CONSTRAINT "Advisor_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
