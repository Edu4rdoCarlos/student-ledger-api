import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Role } from '@prisma/client';
import {
  CERTIFICATE_GENERATION_QUEUE,
  CertificateGenerationJobData,
} from '../../application/queues/certificate-generation.queue';

@Injectable()
export class CertificateQueueService {
  private readonly logger = new Logger(CertificateQueueService.name);

  constructor(
    @InjectQueue(CERTIFICATE_GENERATION_QUEUE)
    private readonly certificateQueue: Queue<CertificateGenerationJobData>,
  ) {}

  async enqueueCertificateGeneration(
    userId: string,
    email: string,
    role: Role,
    approvalId?: string,
  ): Promise<void> {
    try {
      await this.certificateQueue.add(
        { userId, email, role, approvalId },
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
      this.logger.log(`Certificado enfileirado para usuário ${userId} (${email})`);
    } catch (error) {
      this.logger.error(`Falha ao enfileirar certificado: ${error.message}`);
      throw error;
    }
  }
}
