import { ApiProperty } from '@nestjs/swagger';
import { Advisor } from '../../../domain/entities';

export class AdvisorResponseDto {
  @ApiProperty({ description: 'ID do orientador' })
  id: string;

  @ApiProperty({ description: 'ID do usuário associado' })
  userId: string;

  @ApiProperty({ required: false, description: 'ID do departamento' })
  departmentId?: string;

  @ApiProperty({ required: false, description: 'Área de especialização' })
  specialization?: string;

  @ApiProperty({ required: false, description: 'ID do curso' })
  courseId?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  static fromEntity(advisor: Advisor): AdvisorResponseDto {
    const dto = new AdvisorResponseDto();
    dto.id = advisor.id;
    dto.userId = advisor.userId;
    dto.departmentId = advisor.departmentId;
    dto.specialization = advisor.specialization;
    dto.courseId = advisor.courseId;
    dto.createdAt = advisor.createdAt;
    dto.updatedAt = advisor.updatedAt;
    return dto;
  }
}
