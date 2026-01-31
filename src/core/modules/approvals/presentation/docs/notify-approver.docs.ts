import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import {
  ApiUnauthorizedErrorResponse,
  ApiNotFoundErrorResponse,
} from '../../../../../shared/decorators';

export function NotifyApproverDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Notify approver',
      description: `
Sends an email notification to the approver reminding them to review and approve the document.

**Use Case:**
When an approval is pending and the approver hasn't responded, this endpoint can be used
to send a reminder notification requesting their review.

**Flow:**
1. System finds the approval by ID
2. Identifies the approver based on the approval role (COORDINATOR, ADVISOR, or STUDENT)
3. Sends an email notification with the document approval request template

**Permissions:**
- Authenticated users can trigger notifications

**Validations:**
- Approval must exist
- Associated document and defense must exist
      `,
    }),
    ApiParam({
      name: 'approvalId',
      description: 'The ID of the approval to notify',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Notification sent successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: true,
              },
            },
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiNotFoundErrorResponse('Approval not found'),
  );
}
