import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * Documentação padronizada para resposta 400 Bad Request
 */
export function ApiBadRequestResponse(description?: string) {
  return ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: description || 'Requisição inválida - dados fornecidos estão incorretos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Dados inválidos' },
            {
              type: 'array',
              items: { type: 'string' },
              example: ['email must be an email', 'password must be longer than 6 characters'],
            },
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  });
}

/**
 * Documentação padronizada para resposta 401 Unauthorized
 */
export function ApiUnauthorizedErrorResponse(description?: string) {
  return ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: description || 'Não autenticado - token inválido ou expirado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Token inválido ou expirado' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  });
}

/**
 * Documentação padronizada para resposta 403 Forbidden
 */
export function ApiForbiddenErrorResponse(description?: string) {
  return ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: description || 'Acesso negado - permissões insuficientes',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Você não tem permissão para acessar este recurso' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  });
}

/**
 * Documentação padronizada para resposta 404 Not Found
 */
export function ApiNotFoundErrorResponse(description?: string) {
  return ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: description || 'Recurso não encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Recurso não encontrado' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  });
}

/**
 * Documentação padronizada para resposta 422 Unprocessable Entity
 */
export function ApiUnprocessableEntityResponse(description?: string) {
  return ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: description || 'Entidade não processável - arquivo ou formato inválido',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 422 },
        message: { type: 'string', example: 'Arquivo inválido - apenas PDFs são permitidos' },
        error: { type: 'string', example: 'Unprocessable Entity' },
      },
    },
  });
}

/**
 * Documentação padronizada para resposta 429 Too Many Requests
 */
export function ApiTooManyRequestsResponse(description?: string) {
  return ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: description || 'Muitas requisições - limite de taxa excedido',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: { type: 'string', example: 'Limite de requisições excedido. Tente novamente mais tarde.' },
        error: { type: 'string', example: 'Too Many Requests' },
      },
    },
  });
}

/**
 * Documentação padronizada para resposta 500 Internal Server Error
 */
export function ApiInternalServerErrorResponse(description?: string) {
  return ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: description || 'Erro interno do servidor',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Erro interno do servidor. Tente novamente mais tarde.' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  });
}

/**
 * Aplica todas as respostas de erro comuns de autenticação
 */
export function ApiCommonAuthErrors() {
  return applyDecorators(
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
  );
}

/**
 * Aplica respostas de erro comuns para endpoints CRUD
 */
export function ApiCommonCrudErrors() {
  return applyDecorators(
    ApiBadRequestResponse(),
    ApiUnauthorizedErrorResponse(),
    ApiForbiddenErrorResponse(),
    ApiNotFoundErrorResponse(),
    ApiInternalServerErrorResponse(),
  );
}
