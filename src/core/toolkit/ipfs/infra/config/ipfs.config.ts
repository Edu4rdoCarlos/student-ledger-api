import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IpfsConfiguration {
  apiUrl: string;
  timeout: number;
  tls: {
    ca: Buffer | null;
    cert: Buffer | null;
    key: Buffer | null;
    rejectUnauthorized: boolean;
  };
}

@Injectable()
export class IpfsConfigService {
  private readonly logger = new Logger(IpfsConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  getConfiguration(): IpfsConfiguration {
    return {
      apiUrl: this.configService.get<string>('IPFS_API_URL', 'https://localhost:5443'),
      timeout: this.configService.get<number>('IPFS_TIMEOUT', 30000),
      tls: {
        ca: this.loadCertificateInline('IPFS_TLS_CA_CERT'),
        cert: this.loadCertificateInline('IPFS_TLS_CLIENT_CERT'),
        key: this.loadCertificateInline('IPFS_TLS_CLIENT_KEY'),
        rejectUnauthorized: true,
      },
    };
  }

  private loadCertificateInline(envKey: string): Buffer | null {
    const certContent = this.configService.get<string>(envKey);

    if (!certContent) {
      this.logger.error(`Certificado mTLS não encontrado: ${envKey}`);
      return null;
    }

    return Buffer.from(certContent.replace(/\\n/g, '\n'), 'utf-8');
  }
}
