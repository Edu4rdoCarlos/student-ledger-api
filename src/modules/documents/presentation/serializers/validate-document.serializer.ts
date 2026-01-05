import { ValidateDocumentResponseDto } from '../dtos/response/document-response.dto';

interface CurrentUser {
  role?: string;
}

export class ValidateDocumentSerializer {
  static serialize(
    result: ValidateDocumentResponseDto,
    currentUser?: CurrentUser,
  ): Partial<ValidateDocumentResponseDto> {
    const isAdminOrCoordinator =
      currentUser?.role === 'ADMIN' || currentUser?.role === 'COORDINATOR';

    if (!isAdminOrCoordinator) {
      return {
        isValid: result.isValid,
        message: result.message,
      };
    }

    return result;
  }
}
