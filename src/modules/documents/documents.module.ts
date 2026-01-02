import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma';
import { DOCUMENT_REPOSITORY } from './application/ports';
import { PrismaDocumentRepository } from './infra/persistence';
import { DocumentsController } from './presentation/http';
import {
  CreateDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsUseCase,
  ValidateDocumentUseCase,
} from './application/use-cases';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [
    // Repository
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: PrismaDocumentRepository,
    },
    // Use Cases
    CreateDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
    ValidateDocumentUseCase,
  ],
  exports: [DOCUMENT_REPOSITORY],
})
export class DocumentsModule {}
