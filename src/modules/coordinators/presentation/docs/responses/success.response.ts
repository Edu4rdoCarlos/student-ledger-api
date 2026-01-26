import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { CoordinatorResponseDto } from '../../dtos';
import { PaginationMetadata } from '../../../../../shared/dtos';

export const ApiCoordinatorCreatedResponse = () =>
  applyDecorators(
    ApiExtraModels(CoordinatorResponseDto),
    ApiCreatedResponse({
      description: 'Coordenador cadastrado com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(CoordinatorResponseDto),
          },
        },
      },
    }),
  );

export const ApiCoordinatorListResponse = () =>
  applyDecorators(
    ApiExtraModels(CoordinatorResponseDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de coordenadores com metadados de paginação',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(CoordinatorResponseDto) },
          },
          metadata: {
            $ref: getSchemaPath(PaginationMetadata),
          },
        },
      },
    }),
  );
