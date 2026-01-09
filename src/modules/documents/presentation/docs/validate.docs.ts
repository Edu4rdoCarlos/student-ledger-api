import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedErrorResponse,
  ApiTooManyRequestsResponse,
} from '../../../../shared/decorators';
import { ValidateDocumentResponseDto, SimpleDocumentDto } from '../dtos/response';

export function ValidateDocumentDocs() {
  return applyDecorators(
    ApiExtraModels(ValidateDocumentResponseDto, SimpleDocumentDto),
    ApiConsumes('multipart/form-data'),
    ApiOperation({
      summary: 'Validate document authenticity',
      description: `
Validates if a document was registered on blockchain and is authentic.

**Validation Flow:**
1. Calculates SHA-256 hash of uploaded file
2. Searches in Postgres (cache) by hash
3. If not found, searches in Hyperledger Fabric (source of truth)
4. Returns validation result with document details

**Resilient Architecture:**
- Postgres: fast cache for recent documents
- Fabric: source of truth, always consulted if Postgres fails
- Automatic fallback between layers

**Rate Limiting:**
- Maximum: 10 validations per hour per user
- Purpose: prevent abuse of public endpoint

**Returned Information:**
- Validity status (valid/invalid)
- Document details (if found)
- Blockchain information (txId, registration date)
- Associated defense data
      `,
    }),
    ApiOkResponse({
      description: 'Validation result returned successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            $ref: getSchemaPath(ValidateDocumentResponseDto),
          },
        },
      },
    }),
    ApiBadRequestResponse('Invalid file or not a PDF'),
    ApiUnauthorizedErrorResponse(),
    ApiTooManyRequestsResponse('Limit of 10 validations per hour exceeded'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'PDF file to validate',
          },
        },
      },
    }),
  );
}
