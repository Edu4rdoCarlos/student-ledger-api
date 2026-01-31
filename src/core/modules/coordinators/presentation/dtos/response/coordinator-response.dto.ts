import { ApiProperty } from '@nestjs/swagger';
import { Coordinator } from '../../../domain/entities';

export class CourseBasicDto {
  @ApiProperty({ description: 'ID do curso' })
  id: string;

  @ApiProperty({ description: 'Código único do curso' })
  code: string;

  @ApiProperty({ description: 'Nome do curso' })
  name: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export class CoordinatorResponseDto {
  @ApiProperty({ example: 'uuid-do-coordenador' })
  userId: string;

  @ApiProperty({ example: 'Prof. Dr. João Silva' })
  name: string;

  @ApiProperty({ example: 'coordenador@universidade.edu.br' })
  email: string;

  @ApiProperty({ required: false, description: 'Informações do curso' })
  course?: CourseBasicDto;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(coordinator: Coordinator): CoordinatorResponseDto {
    return {
      userId: coordinator.id,
      name: coordinator.name,
      email: coordinator.email,
      course: coordinator.course ? {
        id: coordinator.course.id,
        code: coordinator.course.code,
        name: coordinator.course.name,
        createdAt: coordinator.course.createdAt,
        updatedAt: coordinator.course.updatedAt,
      } : undefined,
      isActive: coordinator.isActive,
      createdAt: coordinator.createdAt!,
      updatedAt: coordinator.updatedAt!,
    };
  }
}
