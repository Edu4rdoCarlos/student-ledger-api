import { CertificateStatus, RevocationReason } from '@prisma/client';

export interface UserCertificateData {
  id: string;
  userId: string;
  approvalId?: string | null;
  certificate: string;
  privateKey: string;
  mspId: string;
  enrollmentId: string;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
  status: CertificateStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCertificateInput {
  userId: string;
  approvalId?: string | null;
  certificate: string;
  privateKey: string;
  mspId: string;
  enrollmentId: string;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
}

export interface ICertificateRepository {
  create(data: CreateCertificateInput): Promise<UserCertificateData>;
  findActiveByUserId(userId: string): Promise<UserCertificateData | null>;
  findActiveByUserIdAndMspId(userId: string, mspId: string): Promise<UserCertificateData | null>;
  findActiveByApprovalId(approvalId: string): Promise<UserCertificateData | null>;
  findActiveByMspId(mspId: string): Promise<UserCertificateData | null>;
  findByUserId(userId: string): Promise<UserCertificateData[]>;
  revoke(
    certificateId: string,
    reason: RevocationReason,
    revokedBy: string,
    notes?: string,
  ): Promise<void>;
  updateStatus(certificateId: string, status: CertificateStatus): Promise<void>;
}

export const CERTIFICATE_REPOSITORY = Symbol('ICertificateRepository');
