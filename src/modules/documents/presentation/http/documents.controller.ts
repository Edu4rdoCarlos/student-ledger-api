import { Controller, Get, Post, Param, Res, StreamableFile, UploadedFile, UseInterceptors, Body, ParseFilePipeBuilder, HttpStatus, MaxFileSizeValidator, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles, CurrentUser } from '../../../../shared/decorators';
import { ICurrentUser } from '../../../../shared/types';
import { ValidateDocumentUseCase, DownloadDocumentUseCase, CreateDocumentVersionUseCase } from '../../application/use-cases';
import { ValidateDocumentResponseDto, CreateDocumentVersionResponseDto } from '../dtos/response';
import { CreateDocumentVersionDto } from '../dtos/request';
import { ValidateDocumentSerializer } from '../serializers';
import { PdfContentValidator } from '../../../../shared/validators';
import { sanitizeFilename } from '../../../../shared/utils';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly validateDocument: ValidateDocumentUseCase,
    private readonly downloadDocument: DownloadDocumentUseCase,
    private readonly createDocumentVersion: CreateDocumentVersionUseCase,
  ) {}

  @Get(':id/download')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiOperation({
    summary: 'Download document (MongoDB with IPFS fallback)',
    description: 'Only ADMIN, COORDINATOR, or defense participants (advisor/students) can download. Students and advisors can only download if the defense is APPROVED.'
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Document file downloaded successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async download(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename, mimeType } = await this.downloadDocument.execute(id, currentUser);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Post('validate')
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Validate document authenticity via file upload' })
  @ApiOkResponse({
    description: 'Document validation result',
    type: ValidateDocumentResponseDto,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to validate',
        },
      },
    },
  })
  async validate(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const result = await this.validateDocument.execute(file.buffer, currentUser);
    return ValidateDocumentSerializer.serialize(result, currentUser);
  }

  @Post(':id/versions')
  @Roles('ADMIN', 'COORDINATOR')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new version of an approved document',
    description: 'Only APPROVED documents that are already on blockchain can be versioned. The previous version will be inactivated and a new version will go through the approval process again.'
  })
  @ApiOkResponse({
    description: 'New version created successfully',
    type: CreateDocumentVersionResponseDto,
  })
  @ApiBody({
    description: 'New document version with updated grade and file',
    schema: {
      type: 'object',
      required: ['finalGrade', 'changeReason', 'document'],
      properties: {
        finalGrade: {
          type: 'number',
          minimum: 0,
          maximum: 10,
          example: 8.5,
          description: 'Updated final grade (0 to 10)'
        },
        changeReason: {
          type: 'string',
          example: 'Correção de nota final após revisão',
          description: 'Reason for creating a new version'
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'New document file (PDF)'
        }
      }
    }
  })
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
  ): Promise<CreateDocumentVersionResponseDto> {
    const safeFilename = sanitizeFilename(file.originalname);

    const { previousVersion, newVersion } = await this.createDocumentVersion.execute({
      documentId: id,
      finalGrade: dto.finalGrade,
      documentFile: file.buffer,
      documentFilename: safeFilename,
      changeReason: dto.changeReason,
    });

    return {
      message: `Nova versão criada com sucesso. Versão ${previousVersion.version} inativada, versão ${newVersion.version} aguardando aprovação.`,
      previousVersion: {
        id: previousVersion.id,
        version: previousVersion.version,
        status: previousVersion.status,
      },
      newVersion: {
        id: newVersion.id,
        version: newVersion.version,
        status: newVersion.status,
        changeReason: newVersion.changeReason,
      },
    };
  }
}
