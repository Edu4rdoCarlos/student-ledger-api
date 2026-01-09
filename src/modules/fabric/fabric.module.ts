import { Global, Module } from '@nestjs/common';
import { FabricService } from './fabric.service';
import { FABRIC_GATEWAY } from './application/ports';
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
  ],
  exports: [FabricService, FABRIC_GATEWAY, FabricOrganizationConfig],
})
export class FabricModule {}
