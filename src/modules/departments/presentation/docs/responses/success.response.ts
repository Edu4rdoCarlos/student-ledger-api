import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { DepartmentResponseDto } from '../../dtos';
import { PaginationMetadata } from '../../../../../shared/dtos';

export const ApiDepartmentOkResponse = () =>
  applyDecorators(
    ApiExtraModels(DepartmentResponseDto),
    ApiOkResponse({
      description: 'Departamento encontrado',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(DepartmentResponseDto),
          },
        },
      },
    }),
  );

export const ApiDepartmentListResponse = () =>
  applyDecorators(
    ApiExtraModels(DepartmentResponseDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de departamentos com metadados de paginação',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(DepartmentResponseDto) },
          },
          metadata: {
            $ref: getSchemaPath(PaginationMetadata),
          },
        },
      },
    }),
  );
