-- CreateEnum
CREATE TYPE "RevocationReason" AS ENUM ('KEY_COMPROMISE', 'AFFILIATION_CHANGED', 'SUPERSEDED', 'CESSATION_OF_OPERATION', 'PRIVILEGE_WITHDRAWN');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CertificateRevocation" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "reason" "RevocationReason" NOT NULL,
    "revokedBy" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "CertificateRevocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCertificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificate" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "mspId" VARCHAR(50) NOT NULL,
    "enrollmentId" VARCHAR(100) NOT NULL,
    "serialNumber" VARCHAR(64) NOT NULL,
    "notBefore" TIMESTAMP(3) NOT NULL,
    "notAfter" TIMESTAMP(3) NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificateRevocation_certificateId_key" ON "CertificateRevocation"("certificateId");

-- CreateIndex
CREATE INDEX "CertificateRevocation_revokedBy_idx" ON "CertificateRevocation"("revokedBy");

-- CreateIndex
CREATE INDEX "CertificateRevocation_revokedAt_idx" ON "CertificateRevocation"("revokedAt");

-- CreateIndex
CREATE INDEX "UserCertificate_userId_idx" ON "UserCertificate"("userId");

-- CreateIndex
CREATE INDEX "UserCertificate_serialNumber_idx" ON "UserCertificate"("serialNumber");

-- CreateIndex
CREATE INDEX "UserCertificate_status_idx" ON "UserCertificate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserCertificate_userId_status_key" ON "UserCertificate"("userId", "status");

-- AddForeignKey
ALTER TABLE "CertificateRevocation" ADD CONSTRAINT "CertificateRevocation_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "UserCertificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCertificate" ADD CONSTRAINT "UserCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
