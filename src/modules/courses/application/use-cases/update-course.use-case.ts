import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { CourseNotFoundError } from '../../domain/errors';
import { UpdateCourseDto, CourseResponseDto } from '../../presentation/dtos';
import { IDepartmentRepository, DEPARTMENT_REPOSITORY } from '../../../departments/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: IDepartmentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
  ) {}

  async execute(code: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const course = await this.courseRepository.findByCode(code);
    if (!course) {
      throw new CourseNotFoundError(code);
    }

    if (dto.departmentId !== undefined) {
      const department = await this.departmentRepository.findById(dto.departmentId);
      if (!department) {
        throw new NotFoundException(`Departamento não encontrado: ${dto.departmentId}`);
      }
    }

    if (dto.coordinatorId !== undefined) {
      const coordinator = await this.advisorRepository.findById(dto.coordinatorId);
      if (!coordinator) {
        throw new NotFoundException(`Coordenador não encontrado: ${dto.coordinatorId}`);
      }

      const targetDepartmentId = dto.departmentId ?? course.departmentId;
      if (coordinator.departmentId !== targetDepartmentId) {
        throw new BadRequestException('Coordenador não pertence ao departamento especificado');
      }
    }

    course.update({
      name: dto.name,
      departmentId: dto.departmentId,
      active: dto.active,
      coordinatorId: dto.coordinatorId,
    });

    const updated = await this.courseRepository.update(course);
    return CourseResponseDto.fromEntity(updated);
  }
}
