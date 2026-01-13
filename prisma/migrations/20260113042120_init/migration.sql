-- CreateEnum
CREATE TYPE "ApprovalRole" AS ENUM ('COORDINATOR', 'ADVISOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DefenseResult" AS ENUM ('PENDING', 'APPROVED', 'FAILED');

-- CreateEnum
CREATE TYPE "DefenseStatus" AS ENUM ('SCHEDULED', 'CANCELED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DefenseEventType" AS ENUM ('CANCELED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "NotificationContextType" AS ENUM ('DEFENSE_APPROVAL', 'DOCUMENT_APPROVAL', 'DEFENSE_CREATED', 'DEFENSE_CANCELED', 'DEFENSE_RESCHEDULED', 'DEFENSE_RESULT', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'RETRY');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT');

-- CreateTable
CREATE TABLE "Advisor" (
    "id" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT,

    CONSTRAINT "Advisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "role" "ApprovalRole" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "justification" TEXT,
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

-- CreateTable
CREATE TABLE "Coordinator" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "courseId" TEXT,

    CONSTRAINT "Coordinator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defense" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "defenseDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "finalGrade" DOUBLE PRECISION,
    "result" "DefenseResult" NOT NULL DEFAULT 'PENDING',
    "status" "DefenseStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "advisorId" TEXT NOT NULL,

    CONSTRAINT "Defense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefenseStudent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defenseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "DefenseStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamBoardMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defenseId" TEXT NOT NULL,

    CONSTRAINT "ExamBoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefenseEvent" (
    "id" TEXT NOT NULL,
    "type" "DefenseEventType" NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defenseId" TEXT NOT NULL,

    CONSTRAINT "DefenseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "documentHash" VARCHAR(64),
    "documentCid" VARCHAR(64),
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "changeReason" TEXT,
    "inactivationReason" TEXT,
    "inactivatedAt" TIMESTAMP(3),
    "blockchainTxId" TEXT,
    "blockchainRegisteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defenseId" TEXT NOT NULL,
    "previousVersionId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "templateId" TEXT,
    "data" JSONB,
    "contextType" "NotificationContextType",
    "contextId" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isFirstAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Advisor_courseId_idx" ON "Advisor"("courseId");

-- CreateIndex
CREATE INDEX "Approval_documentId_idx" ON "Approval"("documentId");

-- CreateIndex
CREATE INDEX "Approval_approverId_idx" ON "Approval"("approverId");

-- CreateIndex
CREATE INDEX "Approval_status_idx" ON "Approval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_documentId_role_approverId_key" ON "Approval"("documentId", "role", "approverId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Coordinator_courseId_key" ON "Coordinator"("courseId");

-- CreateIndex
CREATE INDEX "Coordinator_courseId_idx" ON "Coordinator"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Defense_advisorId_idx" ON "Defense"("advisorId");

-- CreateIndex
CREATE INDEX "Defense_result_idx" ON "Defense"("result");

-- CreateIndex
CREATE INDEX "Defense_status_idx" ON "Defense"("status");

-- CreateIndex
CREATE INDEX "DefenseStudent_defenseId_idx" ON "DefenseStudent"("defenseId");

-- CreateIndex
CREATE INDEX "DefenseStudent_studentId_idx" ON "DefenseStudent"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "DefenseStudent_defenseId_studentId_key" ON "DefenseStudent"("defenseId", "studentId");

-- CreateIndex
CREATE INDEX "ExamBoardMember_defenseId_idx" ON "ExamBoardMember"("defenseId");

-- CreateIndex
CREATE INDEX "ExamBoardMember_email_idx" ON "ExamBoardMember"("email");

-- CreateIndex
CREATE INDEX "DefenseEvent_defenseId_idx" ON "DefenseEvent"("defenseId");

-- CreateIndex
CREATE INDEX "DefenseEvent_type_idx" ON "DefenseEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Document_previousVersionId_key" ON "Document"("previousVersionId");

-- CreateIndex
CREATE INDEX "Document_defenseId_idx" ON "Document"("defenseId");

-- CreateIndex
CREATE INDEX "Document_documentHash_idx" ON "Document"("documentHash");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Document_defenseId_version_key" ON "Document"("defenseId", "version");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_contextType_contextId_idx" ON "Notification"("contextType", "contextId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Student_registration_key" ON "Student"("registration");

-- CreateIndex
CREATE INDEX "Student_courseId_idx" ON "Student"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Advisor" ADD CONSTRAINT "Advisor_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advisor" ADD CONSTRAINT "Advisor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coordinator" ADD CONSTRAINT "Coordinator_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coordinator" ADD CONSTRAINT "Coordinator_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defense" ADD CONSTRAINT "Defense_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefenseStudent" ADD CONSTRAINT "DefenseStudent_defenseId_fkey" FOREIGN KEY ("defenseId") REFERENCES "Defense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefenseStudent" ADD CONSTRAINT "DefenseStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamBoardMember" ADD CONSTRAINT "ExamBoardMember_defenseId_fkey" FOREIGN KEY ("defenseId") REFERENCES "Defense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefenseEvent" ADD CONSTRAINT "DefenseEvent_defenseId_fkey" FOREIGN KEY ("defenseId") REFERENCES "Defense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_defenseId_fkey" FOREIGN KEY ("defenseId") REFERENCES "Defense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
