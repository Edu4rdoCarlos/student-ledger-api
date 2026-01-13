import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
} from '../../../../shared/decorators';
import { ApprovalResponseDto } from '../dtos/response';

export function OverrideRejectionDocs() {
  return applyDecorators(
    ApiExtraModels(ApprovalResponseDto),
    ApiOperation({
      summary: 'Override rejection (Coordinator only)',
      description: `
Allows coordinators to override a rejection and reset the approval back to PENDING status.

**Use Case:**
When a document is rejected by an advisor or student, the coordinator can analyze the rejection.
If the coordinator determines the rejection was invalid or unfounded, they can override it,
resetting the approval to PENDING status and requesting a new review.

**Flow:**
1. Coordinator reviews a rejected approval
2. If rejection is deemed invalid, coordinator overrides it providing a reason
3. System resets approval to PENDING status (removes justification and timestamps)
4. Email notification is sent to the original approver requesting a new review
5. The approver must review the document again

**Permissions:**
- Only coordinators can override rejections
- Coordinators cannot override their own rejections
- Only REJECTED approvals can be overridden

**Validations:**
- User must be a COORDINATOR
- Approval must be in REJECTED status
- Reason for override is mandatory
- Cannot override COORDINATOR role rejections (coordinators shouldn't reject anyway)

**Impact:**
- Approval status changes from REJECTED back to PENDING
- Justification and timestamps are cleared
- Email notification sent to original approver
- Document approval workflow can continue
      `,
    }),
    ApiOkResponse({
      description: 'Rejection overridden successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(ApprovalResponseDto),
          },
        },
      },
    }),
    ApiBadRequestResponse('Approval is not in REJECTED status'),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse('Only coordinators can override rejections, or trying to override own rejection'),
    ApiNotFoundErrorResponse('Approval not found'),
  );
}
