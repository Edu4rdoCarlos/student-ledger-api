import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import {
  ApiUnauthorizedErrorResponse,
  ApiForbiddenErrorResponse,
} from '../../../../shared/decorators';
import { PendingApprovalResponseDto, SignatureDto, StudentDto } from '../dtos/response';

export function ListPendingApprovalsDocs() {
  return applyDecorators(
    ApiExtraModels(PendingApprovalResponseDto, SignatureDto, StudentDto),
    ApiOperation({
      summary: 'List pending approvals with details',
      description: `
Lists pending approvals for the authenticated user with detailed information including document title, students, and all signatures.

**Permissions:**
- COORDINATOR/ADMIN: view all pending approvals
- ADVISOR: view only approvals where they are the approver
- STUDENT: view only their own approvals

**Response includes:**
- Document title (defense title)
- List of students (name and registration)
- Course name
- All signatures for the document with their current status
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'List of pending approvals returned successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
                role: { type: 'string', enum: ['COORDINATOR', 'ADVISOR', 'STUDENT'], example: 'ADVISOR' },
                status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'PENDING' },
                createdAt: { type: 'string', format: 'date-time', example: '2026-01-05T10:00:00Z' },
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
                signatures: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      role: { type: 'string', enum: ['COORDINATOR', 'ADVISOR', 'STUDENT'], example: 'COORDINATOR' },
                      status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'APPROVED' },
                      approverName: { type: 'string', example: 'João Silva' },
                      approvedAt: { type: 'string', format: 'date-time', example: '2026-01-12T10:00:00Z' },
                      justification: { type: 'string', example: 'Documento aprovado' },
                    },
                  },
                },
                approverId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' },
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
