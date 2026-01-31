import { Injectable } from '@nestjs/common';
import { CertificateStatus, RevocationReason } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma';
import {
  ICertificateRepository,
  UserCertificateData,
  CreateCertificateInput,
} from '../../application/ports/certificate.repository.port';

@Injectable()
export class PrismaCertificateRepository implements ICertificateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCertificateInput): Promise<UserCertificateData> {
    return this.prisma.userCertificate.create({
      data: {
        userId: data.userId,
        approvalId: data.approvalId,
        certificate: data.certificate,
        privateKey: data.privateKey,
        mspId: data.mspId,
        enrollmentId: data.enrollmentId,
        serialNumber: data.serialNumber,
        notBefore: data.notBefore,
        notAfter: data.notAfter,
        status: CertificateStatus.ACTIVE,
      },
    });
  }

  async findActiveByUserId(userId: string): Promise<UserCertificateData | null> {
    return this.prisma.userCertificate.findFirst({
      where: {
        userId,
        status: CertificateStatus.ACTIVE,
      },
    });
  }

  async findActiveByUserIdAndMspId(userId: string, mspId: string): Promise<UserCertificateData | null> {
    return this.prisma.userCertificate.findFirst({
      where: {
        userId,
        mspId,
        status: CertificateStatus.ACTIVE,
      },
    });
  }

  async findActiveByApprovalId(approvalId: string): Promise<UserCertificateData | null> {
    return this.prisma.userCertificate.findFirst({
      where: {
        approvalId,
        status: CertificateStatus.ACTIVE,
      },
    });
  }

  async findActiveByMspId(mspId: string): Promise<UserCertificateData | null> {
    return this.prisma.userCertificate.findFirst({
      where: {
        mspId,
        status: CertificateStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserId(userId: string): Promise<UserCertificateData[]> {
    return this.prisma.userCertificate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(
    certificateId: string,
    reason: RevocationReason,
    revokedBy: string,
    notes?: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userCertificate.update({
        where: { id: certificateId },
        data: { status: CertificateStatus.REVOKED },
      }),
      this.prisma.certificateRevocation.create({
        data: {
          certificateId,
          reason,
          revokedBy,
          notes,
        },
      }),
    ]);
  }

  async updateStatus(
    certificateId: string,
    status: CertificateStatus,
  ): Promise<void> {
    await this.prisma.userCertificate.update({
      where: { id: certificateId },
      data: { status },
    });
  }
}
