import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { StudentResponseDto } from '../../dtos';
import { PaginationMetadata } from '../../../../../shared/dtos';

export const ApiStudentCreatedResponse = () =>
  applyDecorators(
    ApiExtraModels(StudentResponseDto),
    ApiCreatedResponse({
      description: 'Estudante cadastrado com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(StudentResponseDto),
          },
        },
      },
    }),
  );

export const ApiStudentOkResponse = () =>
  applyDecorators(
    ApiExtraModels(StudentResponseDto),
    ApiOkResponse({
      description: 'Estudante encontrado',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(StudentResponseDto),
          },
        },
      },
    }),
  );

export const ApiStudentListResponse = () =>
  applyDecorators(
    ApiExtraModels(StudentResponseDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de estudantes com metadados de paginação',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(StudentResponseDto) },
          },
          metadata: {
            $ref: getSchemaPath(PaginationMetadata),
          },
        },
      },
    }),
  );
