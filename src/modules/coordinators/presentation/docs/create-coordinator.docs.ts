import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiCoordinatorCreatedResponse } from './responses';

export const ApiCreateCoordinator = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register new coordinator',
      description: 'Creates a new user with COORDINATOR role and links to coordinator record. Only admins can register coordinators. Coordinator must be assigned to a course.'
    }),
    ApiCoordinatorCreatedResponse(),
    ApiResponse({
      status: 400,
      description: 'Coordinator must be assigned to a course'
    }),
    ApiResponse({
      status: 409,
      description: 'Email already registered or user already a coordinator'
    }),
    ApiResponse({
      status: 404,
      description: 'Course not found'
    }),
    ApiResponse({
      status: 401,
      description: 'Not authenticated'
    }),
    ApiResponse({
      status: 403,
      description: 'No permission. Only admins can register coordinators.'
    }),
  );
