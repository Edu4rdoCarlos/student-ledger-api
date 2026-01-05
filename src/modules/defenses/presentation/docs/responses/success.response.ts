import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { DefenseResponseDto } from '../../dtos/response';
import { AdvisorInDefenseDto } from '../../dtos/response/advisor-in-defense.dto';
import { StudentInDefenseDto } from '../../dtos/response/student-in-defense.dto';
import { DocumentInDefenseDto } from '../../dtos/response/document-in-defense.dto';
import { PaginationMetadata } from '../../../../../shared/dtos';

export const ApiDefenseCreatedResponse = () =>
  applyDecorators(
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, DocumentInDefenseDto),
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
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, DocumentInDefenseDto),
    ApiOkResponse({
      description: 'Defesa encontrada. Os dados retornados dependem da role do usuário: ADMIN/COORDINATOR têm acesso total, ADVISOR/STUDENT participantes veem dados completos, não-participantes veem dados limitados.',
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
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, DocumentInDefenseDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de defesas com metadados de paginação. Os dados retornados dependem da role do usuário: ADMIN/COORDINATOR têm acesso total, ADVISOR/STUDENT participantes veem dados completos, não-participantes veem dados limitados.',
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
