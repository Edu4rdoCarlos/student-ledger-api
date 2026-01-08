import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { CoordinatorResponseDto } from '../../dtos';

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
