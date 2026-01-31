import { applyDecorators } from '@nestjs/common';
import {
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

export const ApiCourseStudentsListErrorResponses = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Não autenticado' }),
    ApiForbiddenResponse({ description: 'Forbidden - Coordinator trying to access students from another course' }),
    ApiNotFoundResponse({ description: 'Course not found' }),
  );

export const ApiCourseAdvisorsListErrorResponses = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Não autenticado' }),
    ApiForbiddenResponse({ description: 'Forbidden - Coordinator trying to access advisors from another course' }),
    ApiNotFoundResponse({ description: 'Course not found' }),
  );
