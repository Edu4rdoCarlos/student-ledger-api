import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { AdvisorResponseDto } from '../../dtos';
import { PaginationMetadata } from '../../../../../../shared/dtos';

export const ApiAdvisorCreatedResponse = () =>
  applyDecorators(
    ApiExtraModels(AdvisorResponseDto),
    ApiCreatedResponse({
      description: 'Orientador cadastrado com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(AdvisorResponseDto),
          },
        },
      },
    }),
  );

export const ApiAdvisorOkResponse = () =>
  applyDecorators(
    ApiExtraModels(AdvisorResponseDto),
    ApiOkResponse({
      description: 'Orientador encontrado com lista de IDs das defesas orientadas. Retorna informações básicas do orientador e apenas os IDs das defesas. Use GET /defenses/:id para obter detalhes completos de cada defesa.',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(AdvisorResponseDto),
          },
        },
      },
    }),
  );

export const ApiAdvisorListResponse = () =>
  applyDecorators(
    ApiExtraModels(AdvisorResponseDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de orientadores com metadados de paginação',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(AdvisorResponseDto) },
          },
          metadata: {
            $ref: getSchemaPath(PaginationMetadata),
          },
        },
      },
    }),
  );
