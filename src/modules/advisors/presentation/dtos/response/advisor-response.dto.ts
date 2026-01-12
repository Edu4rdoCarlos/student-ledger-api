import { ApiProperty } from '@nestjs/swagger';
import { Advisor } from '../../../domain/entities';

class CourseInfo {
  @ApiProperty({ description: 'ID do curso' })
  id: string;

  @ApiProperty({ description: 'Código do curso' })
  code: string;

  @ApiProperty({ description: 'Nome do curso' })
  name: string;
}

export class AdvisorResponseDto {
  @ApiProperty({ description: 'ID do usuário do orientador' })
  userId: string;

  @ApiProperty({ required: false, description: 'Área de especialização' })
  specialization?: string;

  @ApiProperty({ required: false, type: CourseInfo, description: 'Informações do curso' })
  course?: CourseInfo;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  static fromEntity(advisor: Advisor): AdvisorResponseDto {
    const dto = new AdvisorResponseDto();
    dto.userId = advisor.id;
    dto.specialization = advisor.specialization;
    dto.createdAt = advisor.createdAt!;
    dto.updatedAt = advisor.updatedAt!;

    // Incluir informações do curso se disponível
    if (advisor.course) {
      dto.course = {
        id: advisor.course.id,
        code: advisor.course.code,
        name: advisor.course.name,
      };
    }

    return dto;
  }
}
