import { ValidateDocumentResponseDto } from '../dtos/response/document-response.dto';
import { HttpResponse } from '../../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../../shared/serializers';

interface CurrentUser {
  role?: string;
}

export class ValidateDocumentSerializer {
  static serialize(
    result: ValidateDocumentResponseDto,
    currentUser?: CurrentUser,
  ): HttpResponse<Partial<ValidateDocumentResponseDto>> {
    const isAdminOrCoordinator =
      currentUser?.role === 'ADMIN' || currentUser?.role === 'COORDINATOR';

    const serializedResult = !isAdminOrCoordinator
      ? {
          isValid: result.isValid,
          status: result.status,
        }
      : result;

    return HttpResponseSerializer.serialize(serializedResult);
  }
}
