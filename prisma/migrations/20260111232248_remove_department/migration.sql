-- DropForeignKey
ALTER TABLE "Advisor" DROP CONSTRAINT IF EXISTS "Advisor_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_departmentId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Advisor_departmentId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Course_departmentId_idx";

-- AlterTable
ALTER TABLE "Advisor" DROP COLUMN IF EXISTS "departmentId";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN IF EXISTS "departmentId";

-- DropTable
DROP TABLE IF EXISTS "Department";
