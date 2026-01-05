import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma';
import { DOCUMENT_REPOSITORY } from './application/ports';
import { PrismaDocumentRepository } from './infra/persistence';
import { DocumentsController } from './presentation/http';
import {
  CreateDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsUseCase,
  ValidateDocumentUseCase,
  DownloadDocumentUseCase,
} from './application/use-cases';
import { MongoStorageService } from '../../database/mongo';
import { IpfsModule } from '../ipfs/ipfs.module';
import { DefensesModule } from '../defenses/defenses.module';

@Module({
  imports: [PrismaModule, IpfsModule, forwardRef(() => DefensesModule)],
  controllers: [DocumentsController],
  providers: [
    // Repository
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: PrismaDocumentRepository,
    },
    // Storage
    MongoStorageService,
    // Use Cases
    CreateDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
    ValidateDocumentUseCase,
    DownloadDocumentUseCase,
  ],
  exports: [DOCUMENT_REPOSITORY],
})
export class DocumentsModule {}
