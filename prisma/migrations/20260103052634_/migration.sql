-- AlterTable
ALTER TABLE "Advisor" ADD COLUMN     "specialization" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isFirstAccess" BOOLEAN NOT NULL DEFAULT true;
