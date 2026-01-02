import { Global, Module } from '@nestjs/common';
import { FabricService } from './fabric.service';
import { FABRIC_GATEWAY } from './application/ports';
import { FabricGrpcAdapter } from './infra/adapters';

@Global()
@Module({
  providers: [
    {
      provide: FABRIC_GATEWAY,
      useClass: FabricGrpcAdapter,
    },
    FabricService,
  ],
  exports: [FabricService, FABRIC_GATEWAY],
})
export class FabricModule {}
