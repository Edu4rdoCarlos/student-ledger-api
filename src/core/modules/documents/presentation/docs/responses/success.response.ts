import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { DocumentSchema, ValidateDocumentSchema } from '../schemas';

export const ApiDocumentCreatedResponse = () =>
  applyDecorators(
    ApiCreatedResponse({
      description: 'Documento cadastrado com sucesso',
      type: DocumentSchema,
    }),
  );

export const ApiDocumentOkResponse = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'Documento encontrado',
      type: DocumentSchema,
    }),
  );

export const ApiDocumentListResponse = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'Lista de documentos',
      type: [DocumentSchema],
    }),
  );

export const ApiValidateDocumentResponse = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'Resultado da validação do documento',
      type: ValidateDocumentSchema,
    }),
  );
