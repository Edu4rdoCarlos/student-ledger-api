import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  IIpfsStorage,
  IPFS_STORAGE,
  IpfsUploadResult,
  IpfsFileInfo,
  IpfsHealthStatus,
  IPFS_UPLOAD_QUEUE,
  IpfsUploadJobData,
} from './application';
import { IpfsConnectionError } from './domain/errors';
import { EncryptionUtil } from '../documents/infra/utils/encryption.util';

/**
 * Service de IPFS - Fachada para o adapter de storage
 * Implementa lógica de resiliência com enfileiramento via Redis
 * SEMPRE criptografa arquivos antes do upload e descriptografa após download
 */
@Injectable()
export class IpfsService implements OnModuleInit {
  private readonly logger = new Logger(IpfsService.name);

  constructor(
    @Inject(IPFS_STORAGE)
    private readonly ipfsStorage: IIpfsStorage,
    @InjectQueue(IPFS_UPLOAD_QUEUE)
    private readonly uploadQueue: Queue<IpfsUploadJobData>,
    private readonly encryptionUtil: EncryptionUtil,
  ) {}

  async onModuleInit() {
    try {
      const healthStatus = await this.healthCheck();
      this.logger.log(
        `IPFS conectado com sucesso - Peer ID: ${healthStatus.peerId}`,
      );
    } catch (error) {
      this.logger.warn('IPFS offline no init - uploads serão enfileirados');
    }
  }

  async healthCheck(): Promise<IpfsHealthStatus> {
    return this.ipfsStorage.healthCheck();
  }

  async uploadFile(file: Buffer, filename: string): Promise<IpfsUploadResult | { queued: true }> {
    const encryptedFile = this.encryptionUtil.encrypt(file);

    try {
      return await this.ipfsStorage.uploadFile(encryptedFile, filename);
    } catch (error) {
      if (error instanceof IpfsConnectionError) {
        this.logger.warn(`IPFS offline - enfileirando upload de ${filename}`);

        await this.uploadQueue.add(
          {
            file: encryptedFile,
            filename,
            attemptNumber: 1,
          },
          {
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 10000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );

        return { queued: true };
      }
      throw error;
    }
  }

  async calculateCid(file: Buffer): Promise<string> {
    return this.ipfsStorage.calculateCid(file);
  }

  async downloadFile(cid: string): Promise<Buffer> {
    const encryptedFile = await this.ipfsStorage.downloadFile(cid);

    const decryptedFile = this.encryptionUtil.decrypt(encryptedFile);
    return decryptedFile;
  }

  async exists(cid: string): Promise<boolean> {
    return this.ipfsStorage.exists(cid);
  }

  async getFileInfo(cid: string): Promise<IpfsFileInfo> {
    return this.ipfsStorage.getFileInfo(cid);
  }

  async pin(cid: string): Promise<void> {
    return this.ipfsStorage.pin(cid);
  }

  async unpin(cid: string): Promise<void> {
    return this.ipfsStorage.unpin(cid);
  }

  isValidCid(cid: string): boolean {
    return this.ipfsStorage.isValidCid(cid);
  }
}
