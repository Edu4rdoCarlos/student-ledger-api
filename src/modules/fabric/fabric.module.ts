import { Global, Module } from '@nestjs/common';
import { FabricService } from './fabric.service';
import { FABRIC_GATEWAY } from './application/ports';
import { SignatureService } from './application/services';
import { FabricGrpcAdapter } from './infra/adapters';
import { FabricOrganizationConfig } from './infra/config/fabric-organization.config';

@Global()
@Module({
  providers: [
    {
      provide: FABRIC_GATEWAY,
      useClass: FabricGrpcAdapter,
    },
    FabricService,
    FabricOrganizationConfig,
    SignatureService,
  ],
  exports: [FabricService, FABRIC_GATEWAY, FabricOrganizationConfig, SignatureService],
})
export class FabricModule {}
