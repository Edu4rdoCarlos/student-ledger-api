import { Inject, Injectable } from '@nestjs/common';
import { IDepartmentRepository, DEPARTMENT_REPOSITORY } from '../ports';
import { DepartmentNotFoundError } from '../../domain/errors';
import { DepartmentResponseDto } from '../../presentation/dtos';

@Injectable()
export class GetDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: IDepartmentRepository,
  ) {}

  async execute(id: string): Promise<DepartmentResponseDto> {
    const department = await this.departmentRepository.findById(id);
    if (!department) {
      throw new DepartmentNotFoundError(id);
    }

    return DepartmentResponseDto.fromEntity(department);
  }
}
