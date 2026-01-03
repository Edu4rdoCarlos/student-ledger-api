import { HttpResponse, PaginationMetadata } from '../dtos';

export class HttpResponseSerializer {
  static serialize<T>(data: T): HttpResponse<T> {
    return { data };
  }

  static serializeWithPagination<T>(
    data: T,
    pagination: { page: number; perPage: number; total: number },
  ): HttpResponse<T> {
    return {
      data,
      metadata: new PaginationMetadata(pagination),
    };
  }
}
