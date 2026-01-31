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

/**
 * Service de IPFS - Fachada para o adapter de storage
 * Implementa lógica de resiliência com enfileiramento via Redis
 * Arquivos são armazenados sem criptografia (rede IPFS privada garante isolamento)
 */
@Injectable()
export class IpfsService implements OnModuleInit {
  private readonly logger = new Logger(IpfsService.name);

  constructor(
    @Inject(IPFS_STORAGE)
    private readonly ipfsStorage: IIpfsStorage,
    @InjectQueue(IPFS_UPLOAD_QUEUE)
    private readonly uploadQueue: Queue<IpfsUploadJobData>,
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
    try {
      return await this.ipfsStorage.uploadFile(file, filename);
    } catch (error) {
      if (error instanceof IpfsConnectionError) {
        this.logger.warn(`IPFS offline - enfileirando upload de ${filename}`);

        await this.uploadQueue.add(
          {
            file,
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
    return this.ipfsStorage.downloadFile(cid);
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
