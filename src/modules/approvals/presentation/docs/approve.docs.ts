import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
} from '../../../../shared/decorators';
import { ApprovalResponseDto } from '../dtos/response';

export function ApproveDocumentDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Approve document',
      description: `
Approves a specific document in the approval workflow.

**Flow:**
1. Authenticated user approves document associated with the approval
2. System records approval with timestamp and approver ID
3. If all required approvals are completed, document is registered on blockchain

**Validations:**
- Approval must be in PENDING status
- User must have permission to approve (correct role)
- Approval cannot have been processed previously

**Impact:**
- Approval status changes from PENDING to APPROVED
- If last required approval, document goes to blockchain
      `,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Document approved successfully',
      type: ApprovalResponseDto,
    }),
    ApiBadRequestResponse('Approval already processed or in invalid state'),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse('User does not have permission to approve this document'),
    ApiNotFoundErrorResponse('Approval not found'),
  );
}
