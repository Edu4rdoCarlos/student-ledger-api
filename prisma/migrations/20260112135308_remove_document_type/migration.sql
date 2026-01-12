-- DropIndex
DROP INDEX "Document_defenseId_type_version_key";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "type";

-- DropEnum
DROP TYPE "DocumentType";

-- CreateIndex
CREATE UNIQUE INDEX "Document_defenseId_version_key" ON "Document"("defenseId", "version");
