import { Controller, Get, Post, Param, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
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
import { Roles, Public, CurrentUser } from '../../../../shared/decorators';
import { ValidateDocumentUseCase, DownloadDocumentUseCase } from '../../application/use-cases';
import { ValidateDocumentResponseDto } from '../dtos/response/document-response.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly validateDocument: ValidateDocumentUseCase,
    private readonly downloadDocument: DownloadDocumentUseCase,
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
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Validate document authenticity via file upload (public endpoint)' })
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
  async validate(@UploadedFile() file: Express.Multer.File) {
    return this.validateDocument.execute(file.buffer);
  }
}
