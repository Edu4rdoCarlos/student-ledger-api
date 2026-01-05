/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Department` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_organizationId_fkey";

-- DropIndex
DROP INDEX "Course_organizationId_idx";

-- DropIndex
DROP INDEX "Department_organizationId_idx";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "organizationId";
