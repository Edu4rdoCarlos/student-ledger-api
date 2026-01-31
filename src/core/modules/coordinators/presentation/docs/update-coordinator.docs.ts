import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiCoordinatorCreatedResponse } from './responses';

export const ApiUpdateCoordinator = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update coordinator information',
      description: 'Updates coordinator name, course, and active status. Only admins can update coordinators.'
    }),
    ApiCoordinatorCreatedResponse(),
    ApiResponse({
      status: 400,
      description: 'Invalid data provided'
    }),
    ApiResponse({
      status: 404,
      description: 'Coordinator or course not found'
    }),
    ApiResponse({
      status: 401,
      description: 'Not authenticated'
    }),
    ApiResponse({
      status: 403,
      description: 'No permission. Only admins can update coordinators.'
    }),
  );
