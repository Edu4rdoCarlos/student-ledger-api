import { ApiProperty } from '@nestjs/swagger';
import { Advisor } from '../../../domain/entities';

export class AdvisorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false })
  departamento?: string;

  @ApiProperty({ required: false })
  courseId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(advisor: Advisor): AdvisorResponseDto {
    const dto = new AdvisorResponseDto();
    dto.id = advisor.id;
    dto.userId = advisor.userId;
    dto.departamento = advisor.departamento;
    dto.courseId = advisor.courseId;
    dto.createdAt = advisor.createdAt;
    dto.updatedAt = advisor.updatedAt;
    return dto;
  }
}
