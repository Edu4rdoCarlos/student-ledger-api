import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma';
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
import { IpfsModule } from '../../toolkit/ipfs/ipfs.module';
import { DefensesModule } from '../defenses/defenses.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { FileUploadAdapter } from '../../../shared/adapters';

@Module({
  imports: [
    PrismaModule,
    IpfsModule,
    forwardRef(() => DefensesModule),
    forwardRef(() => ApprovalsModule),
  ],
  controllers: [DocumentsController],
  providers: [
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: PrismaDocumentRepository,
    },
    HashUtil,
    FileUploadAdapter,
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
