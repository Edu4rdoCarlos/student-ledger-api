import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiExtraModels, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
} from '../../../../../shared/decorators';
import { GroupedApprovalResponseDto, ApprovalItemDto, StudentInfoDto } from '../dtos/response';

export function ListPendingApprovalsDocs() {
  return applyDecorators(
    ApiExtraModels(GroupedApprovalResponseDto, ApprovalItemDto, StudentInfoDto),
    ApiOperation({
      summary: 'List all documents with approvals grouped',
      description: `
Lists all documents grouped with their respective approvals for the authenticated user.

**Query Parameters:**
- status (optional): Filter documents that have at least one approval with the specified status (PENDING, APPROVED, or REJECTED)

**Permissions:**
- COORDINATOR/ADMIN: view all documents with all approvals (or filtered by status)
- ADVISOR: view only documents from their defenses with all approvals (or filtered by status)
- STUDENT: view only their own documents with all approvals (or filtered by status)

**Response includes:**
- Document information (ID, title, creation date)
- List of students involved
- Course name
- All approvals for each document (PENDING, APPROVED, REJECTED)
- Summary of approval counts (total, approved, pending, rejected)
      `,
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      description: 'Filter documents that have at least one approval with this status',
    }),
    ApiResponse({
      status: 200,
      description: 'List of approvals grouped by document returned successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                documentId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
                documentTitle: { type: 'string', example: 'Ata de Defesa - TCC Final' },
                students: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Maria Santos' },
                      email: { type: 'string', example: 'maria.santos@example.com' },
                      registration: { type: 'string', example: '2021001' },
                    },
                  },
                },
                courseName: { type: 'string', example: 'Engenharia de Software' },
                createdAt: { type: 'string', format: 'date-time', example: '2026-01-05T10:00:00Z' },
                approvals: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
                      role: { type: 'string', enum: ['COORDINATOR', 'ADVISOR', 'STUDENT'], example: 'ADVISOR' },
                      status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'PENDING' },
                      approverName: { type: 'string', example: 'João Silva' },
                      approvedAt: { type: 'string', format: 'date-time', example: '2026-01-12T10:00:00Z' },
                      justification: { type: 'string', example: 'Documento contém erros' },
                      approverId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' },
                    },
                  },
                },
                summary: {
                  type: 'object',
                  properties: {
                    total: { type: 'number', example: 3 },
                    approved: { type: 'number', example: 1 },
                    pending: { type: 'number', example: 2 },
                    rejected: { type: 'number', example: 0 },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
  );
}
