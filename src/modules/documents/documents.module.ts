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
} from './application/use-cases';
import { HashUtil } from './infra/utils/hash.util';
import { EncryptionUtil } from './infra/utils/encryption.util';
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
    EncryptionUtil,
    // Use Cases
    CreateDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
    ValidateDocumentUseCase,
    DownloadDocumentUseCase,
    CreateDocumentVersionUseCase,
    ListDocumentVersionsUseCase,
  ],
  exports: [DOCUMENT_REPOSITORY, ListDocumentVersionsUseCase],
})
export class DocumentsModule {}
