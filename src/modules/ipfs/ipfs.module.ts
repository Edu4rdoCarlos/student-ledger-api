import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { IpfsService } from './ipfs.service';
import { IPFS_STORAGE, IPFS_UPLOAD_QUEUE } from './application';
import { IpfsHttpAdapter } from './infra/adapters';
import { IpfsUploadProcessor } from './infra/processors';

@Global()
@Module({
  imports: [
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
  ],
  exports: [IpfsService, IPFS_STORAGE, BullModule],
})
export class IpfsModule {}
