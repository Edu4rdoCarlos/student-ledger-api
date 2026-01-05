import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { CourseResponseDto } from '../../dtos/response/course-response.dto';
import { PaginationMetadata } from '../../../../../shared/dtos';

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
