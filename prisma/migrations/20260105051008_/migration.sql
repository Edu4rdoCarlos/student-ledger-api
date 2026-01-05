/*
  Warnings:

  - The values [PENDENTE,APROVADO,INATIVO] on the enum `DocumentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `arquivoPath` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `dataInativacao` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `documentoHash` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `motivoAlteracao` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `motivoInativacao` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `versao` on the `Document` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[defenseId,type,version]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `documentHash` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentStatus_new" AS ENUM ('PENDING', 'APPROVED', 'INACTIVE');
ALTER TABLE "Document" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Document" ALTER COLUMN "status" TYPE "DocumentStatus_new" USING ("status"::text::"DocumentStatus_new");
ALTER TYPE "DocumentStatus" RENAME TO "DocumentStatus_old";
ALTER TYPE "DocumentStatus_new" RENAME TO "DocumentStatus";
DROP TYPE "DocumentStatus_old";
ALTER TABLE "Document" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "Document_defenseId_tipo_versao_key";

-- DropIndex
DROP INDEX "Document_documentoHash_idx";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "arquivoPath",
DROP COLUMN "dataInativacao",
DROP COLUMN "documentoHash",
DROP COLUMN "motivoAlteracao",
DROP COLUMN "motivoInativacao",
DROP COLUMN "tipo",
DROP COLUMN "versao",
ADD COLUMN     "changeReason" TEXT,
ADD COLUMN     "documentHash" VARCHAR(64) NOT NULL,
ADD COLUMN     "inactivatedAt" TIMESTAMP(3),
ADD COLUMN     "inactivationReason" TEXT,
ADD COLUMN     "mongoFileId" TEXT,
ADD COLUMN     "type" "DocumentType" NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Document_documentHash_idx" ON "Document"("documentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Document_defenseId_type_version_key" ON "Document"("defenseId", "type", "version");
