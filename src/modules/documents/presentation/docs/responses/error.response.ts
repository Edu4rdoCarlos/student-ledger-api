import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

export const ApiDocumentNotFoundResponse = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'Documento não encontrado',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'Documento não encontrado' },
          error: { type: 'string', example: 'Not Found' },
        },
      },
    }),
  );

export const ApiDocumentHashConflictResponse = () =>
  applyDecorators(
    ApiConflictResponse({
      description: 'Hash do documento já existe',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 409 },
          message: { type: 'string', example: 'Documento com este hash já existe' },
          error: { type: 'string', example: 'Conflict' },
        },
      },
    }),
  );

export const ApiBadRequestValidationResponse = () =>
  applyDecorators(
    ApiBadRequestResponse({
      description: 'Dados inválidos',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: ['tipo deve ser ATA ou FICHA', 'documentoHash é obrigatório'],
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),
  );

export const ApiUnauthorizedErrorResponse = () =>
  applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Não autenticado',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),
  );

export const ApiForbiddenErrorResponse = () =>
  applyDecorators(
    ApiForbiddenResponse({
      description: 'Sem permissão para acessar este recurso',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden resource' },
          error: { type: 'string', example: 'Forbidden' },
        },
      },
    }),
  );
