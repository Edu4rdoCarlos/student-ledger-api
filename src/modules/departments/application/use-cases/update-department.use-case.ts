import { Inject, Injectable } from '@nestjs/common';
import { IDepartmentRepository, DEPARTMENT_REPOSITORY } from '../ports';
import { DepartmentNotFoundError } from '../../domain/errors';
import { UpdateDepartmentDto, DepartmentResponseDto } from '../../presentation/dtos';

@Injectable()
export class UpdateDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: IDepartmentRepository,
  ) {}

  async execute(id: string, dto: UpdateDepartmentDto): Promise<DepartmentResponseDto> {
    const department = await this.departmentRepository.findById(id);
    if (!department) {
      throw new DepartmentNotFoundError(id);
    }

    department.update({
      name: dto.name,
    });

    const updated = await this.departmentRepository.update(department);
    return DepartmentResponseDto.fromEntity(updated);
  }
}
