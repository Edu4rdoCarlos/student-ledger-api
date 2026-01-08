import { applyDecorators } from '@nestjs/common';
import {
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

export const ApiCourseErrorResponses = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Não autenticado' }),
  );

export const ApiCourseCreateErrorResponses = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Não autenticado' }),
    ApiForbiddenResponse({ description: 'Sem permissão. Apenas admins podem cadastrar cursos.' }),
    ApiConflictResponse({ description: 'Código do curso já cadastrado' }),
    ApiNotFoundResponse({ description: 'Organização ou coordenador não encontrado' }),
  );

export const ApiCourseUpdateErrorResponses = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Não autenticado' }),
    ApiForbiddenResponse({ description: 'Sem permissão. Apenas admins podem atualizar cursos.' }),
    ApiNotFoundResponse({ description: 'Curso ou coordenador não encontrado' }),
  );

export const ApiCourseFindOneErrorResponses = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Não autenticado' }),
    ApiNotFoundResponse({ description: 'Curso não encontrado' }),
  );
