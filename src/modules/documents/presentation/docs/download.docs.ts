import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiProduces,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
  ApiInternalServerErrorResponse,
} from '../../../../shared/decorators';

export function DownloadDocumentDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Download document',
      description: `
Downloads a document stored in the system.

**Architecture:**
- Fetches from IPFS (decrypts automatically)

**Permissions:**
- ADMIN/COORDINATOR: can download any document
- ADVISOR: can download only documents from defenses where they are advisor AND defense is APPROVED
- STUDENT: can download only documents from their defenses AND defense is APPROVED

**Security:**
- Documents are encrypted with AES-256-GCM on IPFS
- Automatic decryption on download
- Permission validation by role and defense participation
      `,
    }),
    ApiProduces('application/pdf'),
    ApiOkResponse({
      description: 'Document downloaded successfully',
      schema: {
        type: 'string',
        format: 'binary',
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse('User does not have permission to download this document'),
    ApiNotFoundErrorResponse('Document not found'),
    ApiInternalServerErrorResponse('Error downloading document from IPFS'),
  );
}
