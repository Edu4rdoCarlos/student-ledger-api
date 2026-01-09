import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import {
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
} from '../../../../shared/decorators';
import { ApprovalResponseDto } from '../dtos/response';

export function ListPendingApprovalsDocs() {
  return applyDecorators(
    ApiExtraModels(ApprovalResponseDto),
    ApiOperation({
      summary: 'List pending approvals',
      description: `
Lists pending approvals for the authenticated user.

**Permissions:**
- COORDINATOR/ADMIN: view all pending approvals
- ADVISOR: view only approvals where they are the advisor
- STUDENT: view only their own approvals

**Use cases:**
- Coordinator needs to see all documents awaiting approval
- Advisor needs to approve documents from their students
- Student needs to approve minutes from their defense
      `,
    }),
    ApiOkResponse({
      description: 'List of pending approvals returned successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(ApprovalResponseDto) },
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
  );
}
