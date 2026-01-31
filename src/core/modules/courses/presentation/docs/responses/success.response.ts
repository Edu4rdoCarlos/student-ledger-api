import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { CourseResponseDto } from '../../dtos/response/course-response.dto';
import { PaginationMetadata } from '../../../../../../shared/dtos';

export const ApiCourseCreatedResponse = () =>
  applyDecorators(
    ApiExtraModels(CourseResponseDto),
    ApiCreatedResponse({
      description: 'Curso cadastrado com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(CourseResponseDto),
          },
        },
      },
    }),
  );

export const ApiCourseOkResponse = () =>
  applyDecorators(
    ApiExtraModels(CourseResponseDto),
    ApiOkResponse({
      description: 'Curso encontrado',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(CourseResponseDto),
          },
        },
      },
    }),
  );

export const ApiCourseListResponse = () =>
  applyDecorators(
    ApiExtraModels(CourseResponseDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de cursos com metadados de paginação',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(CourseResponseDto) },
          },
          metadata: {
            $ref: getSchemaPath(PaginationMetadata),
          },
        },
      },
    }),
  );

export const ApiCourseStudentsListResponse = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'Students list retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                registration: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                course: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                defensesCount: { type: 'number', description: 'Quantidade de defesas registradas' },
                defenseStatus: {
                  type: 'string',
                  enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'],
                  description: 'Status da defesa mais recente',
                  nullable: true,
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    }),
  );

export const ApiCourseAdvisorsListResponse = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'Advisors list retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                specialization: { type: 'string', nullable: true },
                isActive: { type: 'boolean' },
                course: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                defensesCount: { type: 'number', description: 'Quantidade de defesas orientadas' },
                defenseStatus: {
                  type: 'string',
                  enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'],
                  description: 'Status da defesa mais recente',
                  nullable: true,
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    }),
  );
