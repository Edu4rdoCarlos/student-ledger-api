import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { StudentResponseDto, StudentListItemDto } from '../../dtos';
import { PaginationMetadata } from '../../../../../../shared/dtos';

export const ApiStudentCreatedResponse = () =>
  applyDecorators(
    ApiExtraModels(StudentResponseDto),
    ApiCreatedResponse({
      description: 'Estudante cadastrado com sucesso',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID do estudante' },
              registration: { type: 'string', description: 'Matrícula do estudante' },
              name: { type: 'string', description: 'Nome do estudante' },
              email: { type: 'string', description: 'Email do estudante' },
              userId: { type: 'string', description: 'ID do usuário associado' },
              course: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'ID do curso' },
                  name: { type: 'string', description: 'Nome do curso' },
                  code: { type: 'string', description: 'Código do curso' },
                },
              },
              createdAt: { type: 'string', format: 'date-time', description: 'Data de criação' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Data de atualização' },
            },
          },
        },
      },
    }),
  );

export const ApiStudentOkResponse = () =>
  applyDecorators(
    ApiExtraModels(StudentResponseDto),
    ApiOkResponse({
      description: 'Estudante encontrado com lista de IDs das defesas. Retorna informações básicas do estudante e apenas os IDs das defesas associadas. Use GET /defenses/:id para obter detalhes completos de cada defesa.',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(StudentResponseDto),
          },
        },
      },
    }),
  );

export const ApiStudentListResponse = () =>
  applyDecorators(
    ApiExtraModels(StudentListItemDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de estudantes com metadados de paginação',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(StudentListItemDto) },
          },
          metadata: {
            $ref: getSchemaPath(PaginationMetadata),
          },
        },
      },
    }),
  );
