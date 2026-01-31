import { CreateDocumentVersionResponseDto } from '../dtos/response';
import { HttpResponse } from '../../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../../shared/serializers';

export class CreateDocumentVersionSerializer {
  static serialize(data: CreateDocumentVersionResponseDto): HttpResponse<CreateDocumentVersionResponseDto> {
    return HttpResponseSerializer.serialize(data);
  }
}
