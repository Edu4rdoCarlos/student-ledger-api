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
import {
  Roles,
  CurrentUser,
  ApiBadRequestResponse,
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
  ApiUnprocessableEntityResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
} from '../../../../shared/decorators';
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
    summary: 'Download document',
    description: `
Downloads a document stored in the system.

**Architecture:**
- First attempts to fetch from cache (MongoDB)
- If not found, fetches from IPFS (decrypts automatically)

**Permissions:**
- ADMIN/COORDINATOR: can download any document
- ADVISOR: can download only documents from defenses where they are advisor AND defense is APPROVED
- STUDENT: can download only documents from their defenses AND defense is APPROVED

**Security:**
- Documents are encrypted with AES-256-GCM on IPFS
- Automatic decryption on download
- Permission validation by role and defense participation
    `,
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Document downloaded successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiUnauthorizedErrorResponse()
  @ApiForbiddenErrorResponse('User does not have permission to download this document')
  @ApiNotFoundErrorResponse('Document not found')
  @ApiInternalServerErrorResponse('Error downloading document from IPFS')
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
  @ApiOperation({
    summary: 'Validate document authenticity',
    description: `
Validates if a document was registered on blockchain and is authentic.

**Validation Flow:**
1. Calculates SHA-256 hash of uploaded file
2. Searches in Postgres (cache) by hash
3. If not found, searches in Hyperledger Fabric (source of truth)
4. Returns validation result with document details

**Resilient Architecture:**
- Postgres: fast cache for recent documents
- Fabric: source of truth, always consulted if Postgres fails
- Automatic fallback between layers

**Rate Limiting:**
- Maximum: 10 validations per hour per user
- Purpose: prevent abuse of public endpoint

**Returned Information:**
- Validity status (valid/invalid)
- Document details (if found)
- Blockchain information (txId, registration date)
- Associated defense data
    `,
  })
  @ApiOkResponse({
    description: 'Validation result returned successfully',
    type: ValidateDocumentResponseDto,
  })
  @ApiBadRequestResponse('Invalid file or not a PDF')
  @ApiUnauthorizedErrorResponse()
  @ApiTooManyRequestsResponse('Limit of 10 validations per hour exceeded')
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
    summary: 'Create new version of approved document',
    description: `
Creates a new version of an already approved and blockchain-registered document.

**Use Cases:**
- Grade correction after appeal
- Update of minutes information
- Correction of errors in approved document

**Requirements:**
- Document must have APPROVED status
- Document must be registered on blockchain (have blockchainTxId)
- Only ADMIN or COORDINATOR can version

**Flow:**
1. Validates that document is APPROVED and on blockchain
2. Validates that new file has different content (different hash)
3. Uploads new file to IPFS (encrypted)
4. Inactivates previous version (status: INACTIVE)
5. Creates new version with PENDING status
6. Updates defense final grade
7. Creates new approvals (COORDINATOR, ADVISOR, STUDENT)

**Validations:**
- Grade between 0 and 10
- Valid PDF file (maximum 10MB)
- File content different from previous version
- Mandatory change reason

**Impact:**
- Old version becomes inactive (preserved for history)
- New version goes through complete approval workflow
- Defense grade is updated
    `,
  })
  @ApiOkResponse({
    description: 'New version created successfully',
    type: CreateDocumentVersionResponseDto,
  })
  @ApiBadRequestResponse('Document cannot be versioned (not approved, no blockchain txId, identical content)')
  @ApiUnauthorizedErrorResponse()
  @ApiForbiddenErrorResponse('Only ADMIN and COORDINATOR can create versions')
  @ApiNotFoundErrorResponse('Document or defense not found')
  @ApiUnprocessableEntityResponse('Invalid file (not PDF or exceeds 10MB)')
  @ApiTooManyRequestsResponse('Limit of 10 versions per hour exceeded')
  @ApiInternalServerErrorResponse('Error uploading to IPFS or creating approvals')
  @ApiBody({
    description: 'New version of document with updated grade',
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
          example: 'Final grade correction after advisor review',
          description: 'Reason for creating new version'
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'New document file (PDF, maximum 10MB)'
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
