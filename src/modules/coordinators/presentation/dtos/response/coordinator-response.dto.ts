import { ApiProperty } from '@nestjs/swagger';
import { Coordinator } from '../../../domain/entities';

export class CoordinatorResponseDto {
  @ApiProperty({ example: 'uuid-do-coordenador' })
  userId: string;

  @ApiProperty({ example: 'uuid-do-curso' })
  courseId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(coordinator: Coordinator): CoordinatorResponseDto {
    return {
      userId: coordinator.id,
      courseId: coordinator.courseId,
      isActive: coordinator.isActive,
      createdAt: coordinator.createdAt!,
      updatedAt: coordinator.updatedAt!,
    };
  }
}
