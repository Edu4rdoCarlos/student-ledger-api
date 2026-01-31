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

  @ApiProperty({ description: 'Nome do orientador' })
  name: string;

  @ApiProperty({ description: 'Email do orientador' })
  email: string;

  @ApiProperty({ description: 'Área de especialização' })
  specialization: string;

  @ApiProperty({ description: 'Indica se o orientador está ativo' })
  isActive: boolean;

  @ApiProperty({ required: false, type: CourseInfo, description: 'Informações do curso' })
  course?: CourseInfo;

  @ApiProperty({ description: 'Indica se possui orientações ativas' })
  hasActiveAdvisorship: boolean;

  @ApiProperty({ description: 'Quantidade de orientações ativas' })
  activeAdvisorshipsCount: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiProperty({ required: false, type: [String], isArray: true, description: 'Lista de IDs das defesas orientadas. Use GET /defenses/:id para obter detalhes completos de cada defesa.' })
  defenseIds?: string[];

  static fromEntity(advisor: Advisor, activeAdvisorshipsCount?: number): AdvisorResponseDto {
    const dto = new AdvisorResponseDto();
    dto.userId = advisor.id;
    dto.name = advisor.name;
    dto.email = advisor.email;
    dto.specialization = advisor.specialization;
    dto.isActive = advisor.isActive;
    dto.createdAt = advisor.createdAt!;
    dto.updatedAt = advisor.updatedAt!;

    dto.activeAdvisorshipsCount = activeAdvisorshipsCount ?? 0;
    dto.hasActiveAdvisorship = dto.activeAdvisorshipsCount > 0;

    if (advisor.course) {
      dto.course = {
        id: advisor.course.id,
        code: advisor.course.code,
        name: advisor.course.name,
      };
    }

    if (advisor.defenses) {
      dto.defenseIds = advisor.defenses.map(defense => defense.id);
    }

    return dto;
  }
}
