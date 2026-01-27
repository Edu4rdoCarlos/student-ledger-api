import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  CERTIFICATE_GENERATION_QUEUE,
  CertificateGenerationJobData,
} from '../../application/queues/certificate-generation.queue';
import { CertificateManagementService } from '../../application/services/certificate-management.service';

@Processor(CERTIFICATE_GENERATION_QUEUE)
export class CertificateGenerationProcessor {
  private readonly logger = new Logger(CertificateGenerationProcessor.name);

  constructor(
    private readonly certificateService: CertificateManagementService,
  ) {}

  @Process()
  async handleCertificateGeneration(job: Job<CertificateGenerationJobData>) {
    const { userId, email, role, approvalId } = job.data;

    try {
      await this.certificateService.generateUserCertificate(userId, email, role, approvalId);
      this.logger.log(`Certificado gerado com sucesso para usuário ${userId} (${email})`);
    } catch (error) {
      this.logger.error(
        `Falha ao gerar certificado para usuário ${userId}: ${error.message}`,
      );
      throw error;
    }
  }
}
