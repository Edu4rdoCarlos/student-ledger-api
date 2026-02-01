import { Controller, Get, Post, Param, Query, Res, StreamableFile, UploadedFile, UseInterceptors, Body, ParseFilePipeBuilder, HttpStatus, MaxFileSizeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles, CurrentUser } from '../../../../../shared/decorators';
import { ICurrentUser } from '../../../../../shared/types';
import { DocumentType } from '../../domain/entities';
import { ValidateDocumentUseCase, DownloadDocumentUseCase, CreateDocumentVersionUseCase, ListDocumentVersionsUseCase, GetDocumentsSummaryUseCase } from '../../application/use-cases';
import { CreateDocumentVersionResponseDto, DocumentsSummaryResponseDto } from '../dtos/response';
import { CreateDocumentVersionDto } from '../dtos/request';
import { ValidateDocumentSerializer, CreateDocumentVersionSerializer } from '../serializers';
import { PdfContentValidator } from '../../../../../shared/validators';
import { sanitizeFilename } from '../../../../../shared/utils';
import { DownloadDocumentDocs, ValidateDocumentDocs, CreateDocumentVersionDocs, GetDocumentsSummaryDocs } from '../docs';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly validateDocument: ValidateDocumentUseCase,
    private readonly downloadDocument: DownloadDocumentUseCase,
    private readonly createDocumentVersion: CreateDocumentVersionUseCase,
    private readonly listDocumentVersions: ListDocumentVersionsUseCase,
    private readonly getDocumentsSummary: GetDocumentsSummaryUseCase,
  ) {}

  @Get(':id/download')
  @Roles('COORDINATOR', 'ADVISOR', 'STUDENT')
  @DownloadDocumentDocs()
  async download(
    @Param('id') id: string,
    @Query('type') documentType: DocumentType | undefined,
    @CurrentUser() currentUser: ICurrentUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename, mimeType } = await this.downloadDocument.execute(id, currentUser, documentType);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Post('validate')
  @Roles('COORDINATOR', 'ADVISOR', 'STUDENT')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @UseInterceptors(FileInterceptor('file'))
  @ValidateDocumentDocs()
  async validate(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }))
        .addValidator(new PdfContentValidator({}))
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        })
    )
    file: Express.Multer.File,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const result = await this.validateDocument.execute(file.buffer, currentUser);
    return ValidateDocumentSerializer.serialize(result, currentUser);
  }

  @Post(':id/versions')
  @Roles('COORDINATOR')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @UseInterceptors(FileInterceptor('document'))
  @CreateDocumentVersionDocs()
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreateDocumentVersionDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }))
        .addValidator(new PdfContentValidator({}))
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
    )
    file: Express.Multer.File,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const safeFilename = sanitizeFilename(file.originalname);

    const { previousVersion, newVersion } = await this.createDocumentVersion.execute({
      documentId: id,
      documentType: dto.documentType,
      finalGrade: dto.finalGrade,
      documentFile: file.buffer,
      documentFilename: safeFilename,
      changeReason: dto.changeReason,
      coordinatorId: currentUser.id,
    });

    const allVersions = await this.listDocumentVersions.execute(newVersion.defenseId);

    const responseData = {
      message: `Nova versão criada com sucesso. Versão ${previousVersion.version} inativada, versão ${newVersion.version} aguardando aprovação.`,
      versions: allVersions.map(doc => ({
        id: doc.id,
        version: doc.version,
        status: doc.status,
        changeReason: doc.changeReason,
        createdAt: doc.createdAt,
      })),
    };

    return CreateDocumentVersionSerializer.serialize(responseData);
  }

  @Get('summary')
  @Roles('COORDINATOR')
  @GetDocumentsSummaryDocs()
  async getSummary(): Promise<DocumentsSummaryResponseDto> {
    return this.getDocumentsSummary.execute();
  }
}
