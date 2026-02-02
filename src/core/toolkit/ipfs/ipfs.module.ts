import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { IpfsService, IPFS_STORAGE, IPFS_UPLOAD_QUEUE, UploadFileUseCase } from './application';
import { IpfsHttpAdapter } from './infra/adapters';
import { IpfsUploadProcessor } from './infra/processors';
import { IpfsConfigService } from './infra/config';

@Global()
@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: IPFS_UPLOAD_QUEUE,
    }),
  ],
  providers: [
    {
      provide: IPFS_STORAGE,
      useClass: IpfsHttpAdapter,
    },
    IpfsService,
    IpfsUploadProcessor,
    IpfsConfigService,
    UploadFileUseCase,
  ],
  exports: [IpfsService, IPFS_STORAGE, BullModule],
})
export class IpfsModule {}
