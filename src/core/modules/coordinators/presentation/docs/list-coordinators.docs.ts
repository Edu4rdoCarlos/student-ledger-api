import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiCoordinatorListResponse } from './responses';

export const ApiListCoordinators = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List coordinators',
      description: 'Returns a paginated list of all coordinators. Only admins can list coordinators.'
    }),
    ApiCoordinatorListResponse(),
    ApiResponse({
      status: 401,
      description: 'Not authenticated'
    }),
    ApiResponse({
      status: 403,
      description: 'No permission. Only admins can list coordinators.'
    }),
  );
