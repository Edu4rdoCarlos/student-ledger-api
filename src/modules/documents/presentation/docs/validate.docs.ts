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

**Input Options:**
- Upload a PDF file (multipart/form-data with 'file' field)
- Provide a SHA-256 hash (form field 'hash')

**Validation Flow:**
1. If file provided: calculates SHA-256 hash of uploaded file
2. If hash provided: uses the provided hash directly
3. Searches in Postgres (cache) by hash
4. If not found, searches in Hyperledger Fabric (source of truth)
5. Returns validation result with document details

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
    ApiBadRequestResponse('Invalid file or hash not provided'),
    ApiUnauthorizedErrorResponse(),
    ApiTooManyRequestsResponse('Limit of 10 validations per hour exceeded'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'PDF file to validate (optional if hash is provided)',
          },
          hash: {
            type: 'string',
            description: 'SHA-256 hash of the document (optional if file is provided)',
            example: 'a3b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
          },
        },
      },
    }),
  );
}
