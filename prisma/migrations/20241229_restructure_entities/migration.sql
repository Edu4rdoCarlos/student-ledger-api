-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SECRETARY', 'COORDINATOR', 'ADVISOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('PENDENTE', 'ATIVA', 'INATIVA');

-- CreateEnum
CREATE TYPE "DefenseResult" AS ENUM ('APROVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ATA', 'FICHA');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDENTE', 'APROVADO', 'INATIVO');

-- CreateEnum
CREATE TYPE "ApprovalRole" AS ENUM ('COORDENADOR', 'ORIENTADOR', 'ALUNO');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "mspId" TEXT NOT NULL,
    "peerEndpoint" TEXT NOT NULL,
    "peerName" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "departamento" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "coordenadorId" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advisor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "departamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Advisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defense" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "dataDefesa" TIMESTAMP(3) NOT NULL,
    "notaFinal" DOUBLE PRECISION,
    "resultado" "DefenseResult" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,

    CONSTRAINT "Defense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tipo" "DocumentType" NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "documentoHash" VARCHAR(64) NOT NULL,
    "arquivoPath" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDENTE',
    "motivoAlteracao" TEXT,
    "motivoInativacao" TEXT,
    "dataInativacao" TIMESTAMP(3),
    "blockchainTxId" TEXT,
    "blockchainRegisteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defenseId" TEXT NOT NULL,
    "previousVersionId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "role" "ApprovalRole" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDENTE',
    "justificativa" TEXT,
    "code" VARCHAR(6),
    "codeExpiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,
    "approverId" TEXT,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_nome_key" ON "Organization"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_mspId_key" ON "Organization"("mspId");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Course_codigo_key" ON "Course"("codigo");

-- CreateIndex
CREATE INDEX "Course_organizationId_idx" ON "Course"("organizationId");

-- CreateIndex
CREATE INDEX "Course_coordenadorId_idx" ON "Course"("coordenadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_matricula_key" ON "Student"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_courseId_idx" ON "Student"("courseId");

-- CreateIndex
CREATE INDEX "Student_organizationId_idx" ON "Student"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Advisor_email_key" ON "Advisor"("email");

-- CreateIndex
CREATE INDEX "Advisor_courseId_idx" ON "Advisor"("courseId");

-- CreateIndex
CREATE INDEX "Advisor_organizationId_idx" ON "Advisor"("organizationId");

-- CreateIndex
CREATE INDEX "Defense_studentId_idx" ON "Defense"("studentId");

-- CreateIndex
CREATE INDEX "Defense_advisorId_idx" ON "Defense"("advisorId");

-- CreateIndex
CREATE INDEX "Defense_resultado_idx" ON "Defense"("resultado");

-- CreateIndex
CREATE UNIQUE INDEX "Document_previousVersionId_key" ON "Document"("previousVersionId");

-- CreateIndex
CREATE INDEX "Document_defenseId_idx" ON "Document"("defenseId");

-- CreateIndex
CREATE INDEX "Document_documentoHash_idx" ON "Document"("documentoHash");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Document_defenseId_tipo_versao_key" ON "Document"("defenseId", "tipo", "versao");

-- CreateIndex
CREATE INDEX "Approval_documentId_idx" ON "Approval"("documentId");

-- CreateIndex
CREATE INDEX "Approval_approverId_idx" ON "Approval"("approverId");

-- CreateIndex
CREATE INDEX "Approval_status_idx" ON "Approval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_documentId_role_key" ON "Approval"("documentId", "role");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_coordenadorId_fkey" FOREIGN KEY ("coordenadorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advisor" ADD CONSTRAINT "Advisor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advisor" ADD CONSTRAINT "Advisor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defense" ADD CONSTRAINT "Defense_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defense" ADD CONSTRAINT "Defense_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_defenseId_fkey" FOREIGN KEY ("defenseId") REFERENCES "Defense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

