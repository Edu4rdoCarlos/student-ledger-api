import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import {
  IPFS_UPLOAD_QUEUE,
  IpfsUploadJobData,
  IpfsUploadJobResult,
} from '../../application/queues';
import { IIpfsStorage, IPFS_STORAGE } from '../../application/ports';

@Processor(IPFS_UPLOAD_QUEUE)
export class IpfsUploadProcessor {
  private readonly logger = new Logger(IpfsUploadProcessor.name);

  constructor(
    @Inject(IPFS_STORAGE)
    private readonly ipfsStorage: IIpfsStorage,
  ) {}

  @Process()
  async handleUpload(job: Job<IpfsUploadJobData>): Promise<IpfsUploadJobResult> {
    const { file, filename } = job.data;

    try {
      const result = await this.ipfsStorage.uploadFile(file, filename);

      return result;
    } catch (error) {
      this.logger.error(`Erro ao processar upload de ${filename}: ${error.message}`);
      throw error;
    }
  }
}
