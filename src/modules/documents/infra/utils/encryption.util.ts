import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class EncryptionUtil {
  private readonly logger = new Logger(EncryptionUtil.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly masterKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get<string>('ENCRYPTION_MASTER_KEY');

    if (!keyHex) {
      this.logger.error('ENCRYPTION_MASTER_KEY não configurada no ambiente');
      throw new Error('ENCRYPTION_MASTER_KEY não configurada');
    }

    if (keyHex.length !== 64) {
      this.logger.error(`ENCRYPTION_MASTER_KEY tem tamanho inválido: ${keyHex.length} (esperado 64)`);
      throw new Error('ENCRYPTION_MASTER_KEY deve ter 64 caracteres hexadecimais (32 bytes)');
    }

    this.masterKey = Buffer.from(keyHex, 'hex');
    this.logger.log('Serviço de criptografia inicializado com sucesso (AES-256-GCM)');
  }

  encrypt(data: Buffer): Buffer {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.masterKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([
      iv,
      authTag,
      encrypted,
    ]);
  }

  decrypt(encryptedData: Buffer): Buffer {
    const iv = encryptedData.subarray(0, 16);
    const authTag = encryptedData.subarray(16, 32);
    const encrypted = encryptedData.subarray(32);

    const decipher = createDecipheriv(this.algorithm, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
  }

  verifyIntegrity(encryptedData: Buffer): boolean {
    try {
      this.decrypt(encryptedData);
      return true;
    } catch {
      return false;
    }
  }
}
