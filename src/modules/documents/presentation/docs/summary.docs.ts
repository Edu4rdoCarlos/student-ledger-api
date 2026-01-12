import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DocumentsSummaryResponseDto } from '../dtos/response';

export const GetDocumentsSummaryDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get documents summary',
      description: 'Returns a summary with total documents, pending, approved and total students',
    }),
    ApiResponse({
      status: 200,
      description: 'Documents summary retrieved successfully',
      type: DocumentsSummaryResponseDto,
      schema: {
        example: {
          totalDocuments: 2,
          pendingDocuments: 1,
          approvedDocuments: 1,
          totalStudents: 24,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - User does not have required role',
    }),
  );
};
