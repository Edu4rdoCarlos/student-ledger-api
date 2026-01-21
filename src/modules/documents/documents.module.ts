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
  CreateDocumentVersionUseCase,
  ListDocumentVersionsUseCase,
  GetDocumentsSummaryUseCase,
} from './application/use-cases';
import { HashUtil } from './infra/utils/hash.util';
import { IpfsModule } from '../ipfs/ipfs.module';
import { DefensesModule } from '../defenses/defenses.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [PrismaModule, IpfsModule, forwardRef(() => DefensesModule), forwardRef(() => ApprovalsModule)],
  controllers: [DocumentsController],
  providers: [
    // Repository
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: PrismaDocumentRepository,
    },
    // Utils
    HashUtil,
    // Use Cases
    CreateDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
    ValidateDocumentUseCase,
    DownloadDocumentUseCase,
    CreateDocumentVersionUseCase,
    ListDocumentVersionsUseCase,
    GetDocumentsSummaryUseCase,
  ],
  exports: [DOCUMENT_REPOSITORY, ListDocumentVersionsUseCase],
})
export class DocumentsModule {}
