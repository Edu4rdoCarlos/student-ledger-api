import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { DefenseResponseDto } from '../../dtos/response';
import { PaginationMetadata } from '../../../../../shared/dtos';

export const ApiDefenseCreatedResponse = () =>
  applyDecorators(
    ApiExtraModels(DefenseResponseDto),
    ApiCreatedResponse({
      description: 'Defesa criada com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(DefenseResponseDto),
          },
        },
      },
    }),
  );

export const ApiDefenseOkResponse = () =>
  applyDecorators(
    ApiExtraModels(DefenseResponseDto),
    ApiOkResponse({
      description: 'Defesa encontrada',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(DefenseResponseDto),
          },
        },
      },
    }),
  );

export const ApiDefenseListResponse = () =>
  applyDecorators(
    ApiExtraModels(DefenseResponseDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de defesas com metadados de paginação',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(DefenseResponseDto) },
          },
          metadata: {
            $ref: getSchemaPath(PaginationMetadata),
          },
        },
      },
    }),
  );
