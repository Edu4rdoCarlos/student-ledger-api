import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

export const ApiSubmitResultRequest = () =>
  applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Defense result with grade and document file',
      schema: {
        type: 'object',
        required: ['finalGrade', 'document'],
        properties: {
          finalGrade: {
            type: 'number',
            minimum: 0,
            maximum: 10,
            example: 8.5,
            description: 'Final grade (0 to 10). Grades >= 7 pass, < 7 fail',
          },
          document: {
            type: 'string',
            format: 'binary',
            description: 'Unified defense document file (PDF containing all pages)',
          },
        },
      },
    }),
  );
