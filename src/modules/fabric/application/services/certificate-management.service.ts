import { Injectable, Inject, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';
import {
  IFabricCAService,
  FABRIC_CA_SERVICE,
  ICertificateRepository,
  CERTIFICATE_REPOSITORY,
} from '../ports';

@Injectable()
export class CertificateManagementService {
  private readonly logger = new Logger(CertificateManagementService.name);

  constructor(
    @Inject(FABRIC_CA_SERVICE)
    private readonly fabricCA: IFabricCAService,
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certRepository: ICertificateRepository,
  ) {}

  async generateUserCertificate(
    userId: string,
    email: string,
    role: Role,
  ): Promise<void> {
    // Check if user already has an active certificate
    const existingCert = await this.certRepository.findActiveByUserId(userId);
    if (existingCert) {
      this.logger.log(`User ${userId} already has an active certificate, skipping generation`);
      return;
    }

    const { orgName, mspId, affiliation } = this.getOrgInfo(role);
    let enrollmentId = this.createEnrollmentId(email, orgName);

    try {
      let secret: string;

      try {
        secret = await this.fabricCA.register(enrollmentId, affiliation, role.toLowerCase());
      } catch (registerError) {
        // If identity already registered (code 74), add version suffix and retry
        if (registerError.message?.includes('already registered')) {
          // Use short version suffix (6 chars) to keep total under 64 char CN limit
          const versionSuffix = `_${Date.now().toString(36)}`; // Base36 for shorter string
          const maxBaseLength = 64 - versionSuffix.length;

          // Truncate base enrollmentId if needed
          const baseId = enrollmentId.length > maxBaseLength
            ? enrollmentId.substring(0, maxBaseLength)
            : enrollmentId;

          enrollmentId = `${baseId}${versionSuffix}`;
          this.logger.log(`Identity already exists, creating new version: ${enrollmentId} (${enrollmentId.length} chars)`);
          secret = await this.fabricCA.register(enrollmentId, affiliation, role.toLowerCase());
        } else {
          throw registerError;
        }
      }

      const enrollment = await this.fabricCA.enroll(enrollmentId, secret);

      const certInfo = this.parseCertificate(enrollment.certificate);

      await this.certRepository.create({
        userId,
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
      this.logger.error(`Failed to generate certificate for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getUserCertificate(userId: string): Promise<{
    cert: string;
    key: string;
    mspId: string;
  } | null> {
    const certData = await this.certRepository.findActiveByUserId(userId);

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

  async revokeCertificate(
    userId: string,
    reason: string,
    revokedBy: string,
  ): Promise<void> {
    const certData = await this.certRepository.findActiveByUserId(userId);

    if (!certData) {
      throw new Error('No active certificate found for user');
    }

    await this.fabricCA.revoke(certData.enrollmentId, reason);

    await this.certRepository.revoke(certData.id, reason as any, revokedBy);

    this.logger.log(`Certificate revoked for user ${userId}`);
  }

  private getOrgInfo(role: Role): {
    orgName: string;
    mspId: string;
    affiliation: string;
  } {
    const map: Record<Role, { orgName: string; mspId: string; affiliation: string }> = {
      ADMIN: {
        orgName: 'coordenacao',
        mspId: 'CoordenacaoMSP',
        affiliation: 'coordenacao.department1',
      },
      COORDINATOR: {
        orgName: 'coordenacao',
        mspId: 'CoordenacaoMSP',
        affiliation: 'coordenacao.department1',
      },
      ADVISOR: {
        orgName: 'orientador',
        mspId: 'OrientadorMSP',
        affiliation: 'orientador.department1',
      },
      STUDENT: {
        orgName: 'aluno',
        mspId: 'AlunoMSP',
        affiliation: 'aluno.department1',
      },
    };

    return map[role];
  }

  private createEnrollmentId(email: string, orgName: string): string {
    return `${email.replace('@', '_at_').replace(/\./g, '_')}_${orgName}`;
  }

  private parseCertificate(pemCert: string): {
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
