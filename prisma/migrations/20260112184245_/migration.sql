/*
  Warnings:

  - A unique constraint covering the columns `[documentId,role,approverId]` on the table `Approval` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Approval_documentId_role_key";

-- CreateIndex
CREATE UNIQUE INDEX "Approval_documentId_role_approverId_key" ON "Approval"("documentId", "role", "approverId");
