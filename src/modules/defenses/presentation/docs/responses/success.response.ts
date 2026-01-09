import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { DefenseResponseDto, ExamBoardMemberResponseDto } from '../../dtos/response';
import { AdvisorInDefenseDto } from '../../dtos/response/advisor-in-defense.dto';
import { StudentInDefenseDto } from '../../dtos/response/student-in-defense.dto';
import { DocumentInDefenseDto } from '../../dtos/response/document-in-defense.dto';
import { PaginationMetadata } from '../../../../../shared/dtos';
import { DocumentResponseDto } from '../../../../documents/presentation/dtos/response';

export const ApiDefenseCreatedResponse = () =>
  applyDecorators(
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, DocumentInDefenseDto, ExamBoardMemberResponseDto),
    ApiCreatedResponse({
      description: 'Defesa criada com sucesso. Inclui informações sobre local, status, banca examinadora (se fornecida), orientador, alunos e documentos.',
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
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, DocumentInDefenseDto, ExamBoardMemberResponseDto),
    ApiOkResponse({
      description: 'Defesa encontrada. Os dados retornados dependem da role do usuário: ADMIN/COORDINATOR têm acesso total (incluindo local, status e banca examinadora), ADVISOR/STUDENT participantes veem dados completos, não-participantes veem dados limitados.',
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
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, DocumentInDefenseDto, ExamBoardMemberResponseDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de defesas com metadados de paginação. Os dados retornados dependem da role do usuário: ADMIN/COORDINATOR têm acesso total (incluindo local, status e banca), ADVISOR/STUDENT participantes veem dados completos, não-participantes veem dados limitados.',
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

export const ApiDefenseCancelResponse = () =>
  applyDecorators(
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, DocumentInDefenseDto, ExamBoardMemberResponseDto),
    ApiOkResponse({
      description: 'Defesa cancelada com sucesso. O status da defesa é atualizado para CANCELED. Não é possível cancelar defesas já concluídas.',
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

export const ApiDefenseRescheduleResponse = () =>
  applyDecorators(
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, DocumentInDefenseDto, ExamBoardMemberResponseDto),
    ApiOkResponse({
      description: 'Defesa reagendada com sucesso. A data da defesa é atualizada. Não é possível reagendar defesas canceladas ou já concluídas.',
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

export const ApiDocumentHistoryResponse = () =>
  applyDecorators(
    ApiExtraModels(DocumentResponseDto),
    ApiOkResponse({
      description: 'Lista de versões do documento da defesa, ordenadas da mais recente para a mais antiga.',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(DocumentResponseDto) },
          },
          total: {
            type: 'number',
            description: 'Número total de versões do documento',
          },
        },
      },
    }),
  );
