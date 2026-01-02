import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

export const ApiStudentNotFoundResponse = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'Estudante não encontrado',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'Estudante não encontrado' },
          error: { type: 'string', example: 'Not Found' },
        },
      },
    }),
  );

export const ApiStudentConflictResponse = () =>
  applyDecorators(
    ApiConflictResponse({
      description: 'Matrícula ou email já cadastrado',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 409 },
          message: { type: 'string', example: 'Matrícula já cadastrada' },
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
            example: ['matricula deve ser uma string', 'email deve ser um email válido'],
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
