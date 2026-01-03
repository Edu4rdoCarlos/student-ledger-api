import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetadata {
  @ApiProperty({ example: 1, description: 'Página atual' })
  page: number;

  @ApiProperty({ example: 10, description: 'Itens por página' })
  perPage: number;

  @ApiProperty({ example: 100, description: 'Total de itens' })
  total: number;

  @ApiProperty({ example: 10, description: 'Total de páginas' })
  totalPages: number;

  constructor(params: { page: number; perPage: number; total: number }) {
    this.page = params.page;
    this.perPage = params.perPage;
    this.total = params.total;
    this.totalPages = Math.ceil(params.total / params.perPage);
  }
}

export interface HttpResponse<T> {
  data: T;
  metadata?: PaginationMetadata;
}
