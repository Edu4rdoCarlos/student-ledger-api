import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { CertificateManagementService } from './certificate-management.service';

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  constructor(
    private readonly certificateService: CertificateManagementService,
  ) {}

  async sign(hash: string, userId: string, approvalId?: string): Promise<string> {
    const certData = approvalId
      ? await this.certificateService.getUserCertificateByApprovalId(approvalId)
      : await this.certificateService.getUserCertificate(userId);

    if (!certData) {
      this.logger.error(`Certificado não encontrado para usuário ${userId}`);
      throw new Error(
        'Certificado digital não encontrado. Entre em contato com o administrador.',
      );
    }

    const privateKey = crypto.createPrivateKey(certData.key);
    const sign = crypto.createSign('SHA256');
    sign.update(hash);
    const signature = sign.sign(privateKey, 'base64');

    this.logger.log(`Documento assinado pelo usuário ${userId} com MSP ${certData.mspId}`);

    return signature;
  }

  async verify(hash: string, signature: string, userId: string): Promise<boolean> {
    const certData = await this.certificateService.getUserCertificate(userId);

    if (!certData) {
      this.logger.error(`Certificado não encontrado para verificação - usuário ${userId}`);
      return false;
    }

    const verify = crypto.createVerify('SHA256');
    verify.update(hash);

    return verify.verify(certData.cert, signature, 'base64');
  }
}
