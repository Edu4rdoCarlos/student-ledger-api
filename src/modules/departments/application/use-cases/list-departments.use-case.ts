import { Inject, Injectable } from '@nestjs/common';
import { IDepartmentRepository, DEPARTMENT_REPOSITORY } from '../ports';
import { DepartmentResponseDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../shared/dtos';

export interface ListDepartmentsQuery {
  page?: number;
  perPage?: number;
}

export interface ListDepartmentsResponse {
  data: DepartmentResponseDto[];
  metadata: PaginationMetadata;
}

@Injectable()
export class ListDepartmentsUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: IDepartmentRepository,
  ) {}

  async execute(query?: ListDepartmentsQuery): Promise<ListDepartmentsResponse> {
    const page = query?.page || 1;
    const perPage = query?.perPage || 10;
    const skip = (page - 1) * perPage;

    const { items, total } = await this.departmentRepository.findAll({
      skip,
      take: perPage,
    });

    return {
      data: items.map(DepartmentResponseDto.fromEntity),
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }
}
