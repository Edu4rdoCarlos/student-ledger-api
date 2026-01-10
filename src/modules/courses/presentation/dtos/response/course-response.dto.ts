import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../../../domain/entities';
import { DepartmentResponseDto } from '../../../../departments/presentation/dtos';

export class CoordinatorBasicDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Email do coordenador' })
  email: string;

  @ApiProperty({ description: 'Nome do coordenador' })
  name: string;

  @ApiProperty({ description: 'Role do usuário', enum: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] })
  role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';
}

export class CourseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Código único do curso' })
  code: string;

  @ApiProperty({ description: 'Nome do curso' })
  name: string;

  @ApiProperty({ required: false, description: 'Informações do departamento' })
  department?: DepartmentResponseDto;

  @ApiProperty({ required: false, description: 'Informações do coordenador' })
  coordinator?: CoordinatorBasicDto;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  static fromEntity(course: Course): CourseResponseDto {
    const dto = new CourseResponseDto();
    dto.id = course.id;
    dto.code = course.code;
    dto.name = course.name;
    dto.department = course.department ? DepartmentResponseDto.fromEntity(course.department) : undefined;
    dto.coordinator = course.coordinator ? {
      id: course.coordinator.id,
      email: course.coordinator.email,
      name: course.coordinator.name,
      role: course.coordinator.role as 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT',
    } : undefined;
    dto.createdAt = course.createdAt;
    dto.updatedAt = course.updatedAt;
    return dto;
  }
}
