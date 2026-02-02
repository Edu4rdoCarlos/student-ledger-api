import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { IIpfsStorage, IPFS_STORAGE, IpfsUploadResult } from '../ports';
import { IPFS_UPLOAD_QUEUE, IpfsUploadJobData } from '../queues';
import { IpfsConnectionError } from '../../domain/errors';

interface UploadFileRequest {
  file: Buffer;
  filename: string;
}

@Injectable()
export class UploadFileUseCase {
  private readonly logger = new Logger(UploadFileUseCase.name);

  constructor(
    @Inject(IPFS_STORAGE)
    private readonly ipfsStorage: IIpfsStorage,
    @InjectQueue(IPFS_UPLOAD_QUEUE)
    private readonly uploadQueue: Queue<IpfsUploadJobData>,
  ) {}

  async execute(request: UploadFileRequest): Promise<IpfsUploadResult | { queued: true }> {
    try {
      return await this.uploadToIpfs(request);
    } catch (error) {
      if (error instanceof IpfsConnectionError) {
        return await this.enqueueUpload(request);
      }
      throw error;
    }
  }

  private async uploadToIpfs(request: UploadFileRequest): Promise<IpfsUploadResult> {
    return await this.ipfsStorage.uploadFile(request.file, request.filename);
  }

  private async enqueueUpload(request: UploadFileRequest): Promise<{ queued: true }> {
    this.logger.warn(`IPFS offline - enfileirando upload de ${request.filename}`);

    await this.uploadQueue.add(
      {
        file: request.file,
        filename: request.filename,
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
}
