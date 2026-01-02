import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { StudentSchema } from '../schemas';

export const ApiStudentCreatedResponse = () =>
  applyDecorators(
    ApiCreatedResponse({
      description: 'Estudante cadastrado com sucesso',
      type: StudentSchema,
    }),
  );

export const ApiStudentOkResponse = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'Estudante encontrado',
      type: StudentSchema,
    }),
  );

export const ApiStudentListResponse = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'Lista de estudantes',
      type: [StudentSchema],
    }),
  );
