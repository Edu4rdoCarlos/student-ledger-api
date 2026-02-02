import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import {
  FABRIC_GATEWAY,
  FABRIC_CA_SERVICE,
  CERTIFICATE_REPOSITORY,
  CERTIFICATE_GENERATION_QUEUE,
  FabricService,
  CertificateManagementService,
} from './application';
import { SignatureService } from './domain/services/signature.service';
import { CertificateQueueService } from './infra/queue/certificate-queue';
import { FabricGrpcAdapter } from './infra/adapters';
import { FabricCAAdapter } from './infra/adapters/fabric-ca.adapter';
import { PrismaCertificateRepository } from './infra/persistence/prisma-certificate.repository';
import { FabricOrganizationConfig } from './infra/config/fabric-organization.config';
import { FabricCAConfig } from './infra/config/fabric-ca.config';
import { FabricNetworkConfig } from './infra/config/fabric-network.config';
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
    FabricCAConfig,
    FabricNetworkConfig,
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
