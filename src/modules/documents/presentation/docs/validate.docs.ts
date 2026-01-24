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
import { ValidateDocumentResponseDto, SimpleDocumentDto, DefenseInfoDto, BlockchainDataDto, BlockchainSignatureDto } from '../dtos/response';

export function ValidateDocumentDocs() {
  return applyDecorators(
    ApiExtraModels(ValidateDocumentResponseDto, SimpleDocumentDto, DefenseInfoDto, BlockchainDataDto, BlockchainSignatureDto),
    ApiConsumes('multipart/form-data'),
    ApiOperation({
      summary: 'Validate document authenticity',
      description: `
Validates if a document was registered on blockchain and is authentic.

**Input:**
- Upload a PDF file (multipart/form-data with 'file' field) - **required**

**Validation Flow (Blockchain-First):**
1. Calculates SHA-256 hash and IPFS CID from uploaded file
2. Queries Hyperledger Fabric directly using the CID
3. If found, returns complete blockchain data including all signatures
4. Optionally enriches with local data (student names, advisor, course)

**Architecture:**
- Hyperledger Fabric is the **source of truth** for document validation
- Local database is only used for supplementary information (names, course)
- Ensures integrity by verifying directly on the immutable blockchain

**Rate Limiting:**
- Maximum: 10 validations per hour per user
- Purpose: prevent abuse of public endpoint

**Returned Information:**
- Validity status (valid/invalid)
- Document details (hash, CID, status)
- Complete blockchain data:
  - Student registration numbers (matriculas)
  - Defense date and final grade
  - Result (APPROVED/FAILED)
  - All cryptographic signatures with timestamps
- Associated defense data (if available locally)
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
    ApiBadRequestResponse('PDF file is required'),
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
            description: 'PDF file to validate (required)',
          },
        },
      },
    }),
  );
}
