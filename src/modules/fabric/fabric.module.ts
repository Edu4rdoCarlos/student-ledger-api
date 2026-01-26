import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FabricService } from './fabric.service';
import {
  FABRIC_GATEWAY,
  FABRIC_CA_SERVICE,
  CERTIFICATE_REPOSITORY,
} from './application/ports';
import { CERTIFICATE_GENERATION_QUEUE } from './application/queues/certificate-generation.queue';
import { SignatureService } from './application/services';
import { CertificateManagementService } from './application/services/certificate-management.service';
import { CertificateQueueService } from './application/services/certificate-queue.service';
import { FabricGrpcAdapter } from './infra/adapters';
import { FabricCAAdapter } from './infra/adapters/fabric-ca.adapter';
import { PrismaCertificateRepository } from './infra/persistence/prisma-certificate.repository';
import { FabricOrganizationConfig } from './infra/config/fabric-organization.config';
import { CertificateGenerationProcessor } from './infra/jobs/certificate-generation.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: CERTIFICATE_GENERATION_QUEUE,
    }),
  ],
  providers: [
    {
      provide: FABRIC_GATEWAY,
      useClass: FabricGrpcAdapter,
    },
    {
      provide: FABRIC_CA_SERVICE,
      useClass: FabricCAAdapter,
    },
    {
      provide: CERTIFICATE_REPOSITORY,
      useClass: PrismaCertificateRepository,
    },
    FabricService,
    FabricOrganizationConfig,
    SignatureService,
    CertificateManagementService,
    CertificateQueueService,
    CertificateGenerationProcessor,
  ],
  exports: [
    FabricService,
    FABRIC_GATEWAY,
    FABRIC_CA_SERVICE,
    FabricOrganizationConfig,
    SignatureService,
    CertificateManagementService,
    CertificateQueueService,
  ],
})
export class FabricModule {}
