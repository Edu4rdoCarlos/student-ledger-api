import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
  ApiUnprocessableEntityResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
} from '../../../../shared/decorators';
import { CreateDocumentVersionResponseDto } from '../dtos/response';

export function CreateDocumentVersionDocs() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiOperation({
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
    }),
    ApiOkResponse({
      description: 'New version created successfully',
      type: CreateDocumentVersionResponseDto,
    }),
    ApiBadRequestResponse('Document cannot be versioned (not approved, no blockchain txId, identical content)'),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse('Only ADMIN and COORDINATOR can create versions'),
    ApiNotFoundErrorResponse('Document or defense not found'),
    ApiUnprocessableEntityResponse('Invalid file (not PDF or exceeds 10MB)'),
    ApiTooManyRequestsResponse('Limit of 10 versions per hour exceeded'),
    ApiInternalServerErrorResponse('Error uploading to IPFS or creating approvals'),
    ApiBody({
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
    }),
  );
}
