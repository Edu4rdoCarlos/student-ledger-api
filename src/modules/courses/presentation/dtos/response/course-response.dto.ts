import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../../../domain/entities';

export class CourseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ required: false })
  departamento?: string;

  @ApiProperty()
  ativo: boolean;

  @ApiProperty()
  organizationId: string;

  @ApiProperty({ required: false })
  coordinatorId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(course: Course): CourseResponseDto {
    const dto = new CourseResponseDto();
    dto.id = course.id;
    dto.codigo = course.codigo;
    dto.nome = course.nome;
    dto.departamento = course.departamento;
    dto.ativo = course.ativo;
    dto.organizationId = course.organizationId;
    dto.coordinatorId = course.coordinatorId;
    dto.createdAt = course.createdAt;
    dto.updatedAt = course.updatedAt;
    return dto;
  }
}
