import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ApprovalRole } from '../../../approvals/domain/entities';

type OrgName = 'coordenacao' | 'orientador' | 'aluno';

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);
  private readonly certsBasePath: string;

  constructor() {
    this.certsBasePath = path.resolve(process.cwd(), 'src/blockchain/certs');
  }

  private getRoleToOrgMap(): Record<ApprovalRole, OrgName> {
    return {
      [ApprovalRole.COORDINATOR]: 'coordenacao',
      [ApprovalRole.ADVISOR]: 'orientador',
      [ApprovalRole.STUDENT]: 'aluno',
    };
  }

  private getOrgByRole(role: ApprovalRole): OrgName {
    return this.getRoleToOrgMap()[role];
  }

  sign(hash: string, role: ApprovalRole): string {
    const org = this.getOrgByRole(role);
    const keyPath = path.join(this.certsBasePath, org, 'key.pem');

    if (!fs.existsSync(keyPath)) {
      this.logger.error(`Chave privada não encontrada: ${keyPath}`);
      throw new Error(`Chave privada não encontrada para organização ${org}`);
    }

    const privateKey = fs.readFileSync(keyPath);

    const sign = crypto.createSign('SHA256');
    sign.update(hash);
    const signature = sign.sign(privateKey, 'base64');

    this.logger.log(`Documento assinado com certificado da organização: ${org}`);

    return signature;
  }

  verify(hash: string, signature: string, role: ApprovalRole): boolean {
    const org = this.getOrgByRole(role);
    const certPath = path.join(this.certsBasePath, org, 'cert.pem');

    if (!fs.existsSync(certPath)) {
      this.logger.error(`Certificado não encontrado: ${certPath}`);
      throw new Error(`Certificado não encontrado para organização ${org}`);
    }

    const publicKey = fs.readFileSync(certPath);

    const verify = crypto.createVerify('SHA256');
    verify.update(hash);

    return verify.verify(publicKey, signature, 'base64');
  }
}
