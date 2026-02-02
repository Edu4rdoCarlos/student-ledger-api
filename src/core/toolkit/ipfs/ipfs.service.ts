import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import {
  IIpfsStorage,
  IPFS_STORAGE,
  IpfsUploadResult,
  IpfsHealthStatus,
} from './application';
import { UploadFileUseCase } from './application/use-cases';

@Injectable()
export class IpfsService implements OnModuleInit {
  private readonly logger = new Logger(IpfsService.name);

  constructor(
    @Inject(IPFS_STORAGE)
    private readonly ipfsStorage: IIpfsStorage,
    private readonly uploadFileUseCase: UploadFileUseCase,
  ) {}

  async onModuleInit() {
    await this.logConnectionStatus();
  }

  async healthCheck(): Promise<IpfsHealthStatus> {
    return this.ipfsStorage.healthCheck();
  }

  async uploadFile(file: Buffer, filename: string): Promise<IpfsUploadResult | { queued: true }> {
    return await this.uploadFileUseCase.execute({ file, filename });
  }

  async calculateCid(file: Buffer): Promise<string> {
    return this.ipfsStorage.calculateCid(file);
  }

  async downloadFile(cid: string): Promise<Buffer> {
    return this.ipfsStorage.downloadFile(cid);
  }

  private async logConnectionStatus(): Promise<void> {
    try {
      const healthStatus = await this.healthCheck();
      this.logger.log(`IPFS conectado com sucesso - Peer ID: ${healthStatus.peerId}`);
    } catch (error) {
      this.logger.warn('IPFS offline no init - uploads serão enfileirados');
    }
  }
}
