import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
} from '../../../../shared/decorators';
import { ApprovalResponseDto } from '../dtos/response';

export function RejectDocumentDocs() {
  return applyDecorators(
    ApiExtraModels(ApprovalResponseDto),
    ApiOperation({
      summary: 'Reject document',
      description: `
Rejects a document in the approval workflow with mandatory justification.

**Flow:**
1. Authenticated user rejects document providing justification (minimum 10 characters)
2. System records rejection with timestamp, approver ID, and justification
3. Document is not registered on blockchain
4. Coordinator can create new version of document to fix issues

**Validations:**
- Approval must be in PENDING status
- Justification is mandatory (minimum 10 characters)
- User must have permission to reject (correct role)
- Approval cannot have been processed previously

**Impact:**
- Approval status changes from PENDING to REJECTED
- Document does not proceed to blockchain
- Approval workflow is interrupted
      `,
    }),
    ApiOkResponse({
      description: 'Document rejected successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(ApprovalResponseDto),
          },
        },
      },
    }),
    ApiBadRequestResponse('Approval already processed, justification missing or invalid'),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse('User does not have permission to reject this document'),
    ApiNotFoundErrorResponse('Approval not found'),
  );
}
