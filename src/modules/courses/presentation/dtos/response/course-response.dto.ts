import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../../../domain/entities';

export class CourseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Código único do curso' })
  code: string;

  @ApiProperty({ description: 'Nome do curso' })
  name: string;

  @ApiProperty({ required: false, description: 'ID do departamento' })
  departmentId?: string;

  @ApiProperty({ description: 'Indica se o curso está ativo' })
  active: boolean;

  @ApiProperty({ required: false, description: 'ID do coordenador' })
  coordinatorId?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  static fromEntity(course: Course): CourseResponseDto {
    const dto = new CourseResponseDto();
    dto.id = course.id;
    dto.code = course.code;
    dto.name = course.name;
    dto.departmentId = course.departmentId;
    dto.active = course.active;
    dto.coordinatorId = course.coordinatorId;
    dto.createdAt = course.createdAt;
    dto.updatedAt = course.updatedAt;
    return dto;
  }
}
