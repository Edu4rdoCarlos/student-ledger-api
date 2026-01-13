import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { DefenseResponseDto, ExamBoardMemberResponseDto, DefenseListItemDto } from '../../dtos/response';
import { DocumentApprovalDto, DocumentWithApprovalsDto } from '../../dtos/response/defense-response.dto';
import { AdvisorInDefenseDto } from '../../dtos/response/advisor-in-defense.dto';
import { StudentInDefenseDto } from '../../dtos/response/student-in-defense.dto';
import { DocumentVersionDto } from '../../dtos/response/document-version.dto';
import { PaginationMetadata } from '../../../../../shared/dtos';
import { DocumentResponseDto } from '../../../../documents/presentation/dtos/response';

export const ApiDefenseCreatedResponse = () =>
  applyDecorators(
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, ExamBoardMemberResponseDto, DocumentWithApprovalsDto, DocumentApprovalDto),
    ApiCreatedResponse({
      description: 'Defesa criada com sucesso. Inclui informações sobre local, status, banca examinadora (se fornecida), orientador, alunos e versões de documentos.',
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
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, ExamBoardMemberResponseDto, DocumentWithApprovalsDto, DocumentApprovalDto),
    ApiOkResponse({
      description: 'Defesa encontrada com informações detalhadas. Inclui: título, data, local, nota final, resultado, status, orientador, estudantes, banca examinadora, documentos com assinaturas/aprovações. Os dados retornados dependem da role do usuário: ADMIN/COORDINATOR têm acesso total, ADVISOR/STUDENT participantes veem dados completos, não-participantes veem dados limitados.',
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
    ApiExtraModels(DefenseListItemDto, PaginationMetadata),
    ApiOkResponse({
      description: 'Lista de defesas com informações básicas e metadados de paginação. Retorna apenas dados essenciais: título, data, status, resultado, orientador e alunos. Para informações detalhadas (banca examinadora, documentos, emails), use o endpoint GET /defenses/:id.',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(DefenseListItemDto) },
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
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, ExamBoardMemberResponseDto, DocumentWithApprovalsDto, DocumentApprovalDto),
    ApiOkResponse({
      description: 'Defesa cancelada com sucesso. O status da defesa é atualizado para CANCELED e um evento de cancelamento é registrado no histórico com o motivo fornecido. Não é possível cancelar defesas já concluídas.',
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
    ApiExtraModels(DefenseResponseDto, AdvisorInDefenseDto, StudentInDefenseDto, ExamBoardMemberResponseDto, DocumentWithApprovalsDto, DocumentApprovalDto),
    ApiOkResponse({
      description: 'Defesa reagendada com sucesso. A data da defesa é atualizada e um evento de reagendamento é registrado no histórico com o motivo fornecido e as datas antiga e nova. Não é possível reagendar defesas já concluídas.',
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
