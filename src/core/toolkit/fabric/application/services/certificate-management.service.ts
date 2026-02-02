import { Injectable, Inject, Logger } from '@nestjs/common';
import { Role, RevocationReason } from '@prisma/client';
import * as crypto from 'crypto';
import {
  IFabricCAService,
  FABRIC_CA_SERVICE,
  ICertificateRepository,
  CERTIFICATE_REPOSITORY,
} from '../../application/ports';
import { FabricOrganizationConfig } from '../../infra/config/fabric-organization.config';

interface CertificateData {
  cert: string;
  key: string;
  mspId: string;
}

@Injectable()
export class CertificateManagementService {
  private readonly logger = new Logger(CertificateManagementService.name);

  constructor(
    @Inject(FABRIC_CA_SERVICE)
    private readonly fabricCA: IFabricCAService,
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certRepository: ICertificateRepository,
    private readonly fabricOrgConfig: FabricOrganizationConfig,
  ) {}

  async generateUserCertificate(
    userId: string,
    email: string,
    role: Role,
    approvalId?: string,
  ): Promise<void> {
    if (await this.hasActiveCertificate(userId, approvalId)) {
      this.logger.log(`Certificate already exists for ${approvalId || userId}, skipping generation`);
      return;
    }

    const { orgName, mspId, affiliation } = this.fabricOrgConfig.getOrgInfo(role);
    const enrollmentId = this.createEnrollmentId(email, orgName);

    try {
      const secret = await this.registerWithRetry(enrollmentId, affiliation, role.toLowerCase());
      const enrollment = await this.fabricCA.enroll(enrollmentId, secret);
      const certInfo = this.generateCertificateMetadata(enrollment.certificate);

      await this.certRepository.create({
        userId,
        approvalId,
        certificate: enrollment.certificate,
        privateKey: enrollment.privateKey,
        mspId,
        enrollmentId,
        serialNumber: certInfo.serialNumber,
        notBefore: certInfo.notBefore,
        notAfter: certInfo.notAfter,
      });

      this.logger.log(`Certificate generated for user ${userId} (${email}) in ${orgName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate certificate for user ${userId}: ${errorMessage}`);
      throw error;
    }
  }

  async getUserCertificate(userId: string): Promise<CertificateData | null> {
    return this.getCertificate(userId);
  }

  async getUserCertificateByApprovalId(approvalId: string): Promise<CertificateData | null> {
    return this.getCertificate(undefined, approvalId);
  }

  async revokeCertificateByApprovalId(
    approvalId: string,
    reason: RevocationReason,
    revokedBy: string,
  ): Promise<void> {
    return this.revoke(undefined, approvalId, reason, revokedBy);
  }

  async revokeCertificate(
    userId: string,
    reason: RevocationReason,
    revokedBy: string,
  ): Promise<void> {
    return this.revoke(userId, undefined, reason, revokedBy);
  }

  private async hasActiveCertificate(userId: string, approvalId?: string): Promise<boolean> {
    const cert = approvalId
      ? await this.certRepository.findActiveByApprovalId(approvalId)
      : await this.certRepository.findActiveByUserId(userId);

    return cert !== null;
  }

  private async getCertificate(userId?: string, approvalId?: string): Promise<CertificateData | null> {
    if (!userId && !approvalId) {
      throw new Error('userId or approvalId is required');
    }

    const certData = approvalId
      ? await this.certRepository.findActiveByApprovalId(approvalId)
      : await this.certRepository.findActiveByUserId(userId!);

    if (!certData) {
      return null;
    }

    if (new Date() > certData.notAfter) {
      await this.certRepository.updateStatus(certData.id, 'EXPIRED');
      return null;
    }

    return {
      cert: certData.certificate,
      key: certData.privateKey,
      mspId: certData.mspId,
    };
  }

  private async revoke(
    userId: string | undefined,
    approvalId: string | undefined,
    reason: RevocationReason,
    revokedBy: string,
  ): Promise<void> {
    if (!userId && !approvalId) {
      throw new Error('userId or approvalId is required');
    }

    const certData = approvalId
      ? await this.certRepository.findActiveByApprovalId(approvalId)
      : await this.certRepository.findActiveByUserId(userId!);

    if (!certData) {
      const identifier = approvalId || userId;
      this.logger.warn(`No active certificate found for ${identifier}`);
      return;
    }

    await this.fabricCA.revoke(certData.enrollmentId, reason.toString());
    await this.certRepository.revoke(certData.id, reason, revokedBy);

    this.logger.log(`Certificate revoked for ${approvalId || userId}`);
  }

  private async registerWithRetry(
    enrollmentId: string,
    affiliation: string,
    role: string,
  ): Promise<string> {
    try {
      return await this.fabricCA.register(enrollmentId, affiliation, role);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (!errorMessage.includes('already registered')) {
        throw error;
      }

      const versionSuffix = `_${Date.now().toString(36)}`;
      const maxBaseLength = 64 - versionSuffix.length;
      const baseId = enrollmentId.length > maxBaseLength
        ? enrollmentId.substring(0, maxBaseLength)
        : enrollmentId;

      const newEnrollmentId = `${baseId}${versionSuffix}`;
      this.logger.log(`Identity exists, creating version: ${newEnrollmentId}`);

      return await this.fabricCA.register(newEnrollmentId, affiliation, role);
    }
  }

  private createEnrollmentId(email: string, orgName: string): string {
    return `${email.replace('@', '_at_').replace(/\./g, '_')}_${orgName}`;
  }

  private generateCertificateMetadata(pemCert: string): {
    serialNumber: string;
    notBefore: Date;
    notAfter: Date;
  } {
    const certMatch = pemCert.match(/-----BEGIN CERTIFICATE-----([\s\S]+?)-----END CERTIFICATE-----/);
    if (!certMatch) {
      throw new Error('Invalid certificate format');
    }

    const certBase64 = certMatch[1].replace(/\s/g, '');
    const certDer = Buffer.from(certBase64, 'base64');
    const serialNumberHex = crypto.createHash('sha256').update(certDer).digest('hex').substring(0, 32);

    const now = new Date();
    const notBefore = now;
    const notAfter = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return {
      serialNumber: serialNumberHex,
      notBefore,
      notAfter,
    };
  }
}
