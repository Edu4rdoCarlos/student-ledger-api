/*
  Warnings:

  - Made the column `specialization` on table `Advisor` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULL values with a default specialization
UPDATE "Advisor" SET "specialization" = 'Não especificada' WHERE "specialization" IS NULL;

-- AlterTable
ALTER TABLE "Advisor" ALTER COLUMN "specialization" SET NOT NULL;
