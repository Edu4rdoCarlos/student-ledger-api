import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../../../domain/entities';

export class CourseBasicDto {
  @ApiProperty({ description: 'Código do curso' })
  code: string;

  @ApiProperty({ description: 'Nome do curso' })
  name: string;

  @ApiProperty({ description: 'Status do curso' })
  active: boolean;
}

export class CoordinatorBasicDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Email do coordenador' })
  email: string;

  @ApiProperty({ description: 'Nome do coordenador' })
  name: string;

  @ApiProperty({ description: 'Role do usuário', enum: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] })
  role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';

  @ApiProperty({ description: 'Curso coordenado', type: CourseBasicDto, required: false })
  course?: CourseBasicDto;
}

export class CourseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Código único do curso' })
  code: string;

  @ApiProperty({ description: 'Nome do curso' })
  name: string;

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
    dto.coordinator = course.coordinator ? {
      id: course.coordinator.id,
      email: course.coordinator.email,
      name: course.coordinator.name,
      role: course.coordinator.role as 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT',
      course: course.coordinator.course || undefined,
    } : undefined;
    dto.createdAt = course.createdAt;
    dto.updatedAt = course.updatedAt;
    return dto;
  }
}
