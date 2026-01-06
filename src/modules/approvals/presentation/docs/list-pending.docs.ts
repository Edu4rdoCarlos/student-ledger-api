import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
} from '../../../../shared/decorators';
import { ApprovalResponseDto } from '../dtos/response';

export function ListPendingApprovalsDocs() {
  return applyDecorators(
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
    ApiResponse({
      status: HttpStatus.OK,
      description: 'List of pending approvals returned successfully',
      type: [ApprovalResponseDto],
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
  );
}
