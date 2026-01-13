import { ApiProperty } from '@nestjs/swagger';

export class SimpleCourseDto {
  @ApiProperty({ description: 'ID do curso' })
  id: string;

  @ApiProperty({ description: 'Código do curso' })
  code: string;

  @ApiProperty({ description: 'Nome do curso' })
  name: string;
}

export class DefenseSummaryDto {
  @ApiProperty({ description: 'ID da defesa' })
  id: string;

  @ApiProperty({ description: 'Título da defesa' })
  title: string;

  @ApiProperty({ description: 'Data da defesa' })
  defenseDate: Date;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'FAILED'], description: 'Resultado da defesa' })
  result: string;

  @ApiProperty({ enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'], description: 'Status da defesa' })
  status: string;
}

export class BasicUserStudentDataDto {
  @ApiProperty({ description: 'ID do estudante' })
  userId: string;

  @ApiProperty({ description: 'Matrícula do estudante' })
  registration: string;

  @ApiProperty({ required: false, description: 'Curso do estudante' })
  course?: SimpleCourseDto;

  @ApiProperty({ required: false, type: [DefenseSummaryDto], description: 'Todas as defesas do estudante' })
  defenses?: DefenseSummaryDto[];
}

export class BasicUserAdvisorDataDto {
  @ApiProperty({ description: 'ID do orientador' })
  userId: string;

  @ApiProperty({ required: false, description: 'Área de especialização' })
  specialization?: string;

  @ApiProperty({ required: false, description: 'Curso do orientador' })
  course?: SimpleCourseDto;

  @ApiProperty({ required: false, type: [DefenseSummaryDto], description: 'Todas as defesas orientadas' })
  defenses?: DefenseSummaryDto[];
}

export class BasicUserCoordinatorDataDto {
  @ApiProperty({ description: 'ID do coordenador' })
  userId: string;

  @ApiProperty({ description: 'Status ativo/inativo' })
  isActive: boolean;

  @ApiProperty({ required: false, description: 'Curso coordenado' })
  course?: SimpleCourseDto;

  @ApiProperty({ required: false, type: [DefenseSummaryDto], description: 'Todas as defesas orientadas' })
  defenses?: DefenseSummaryDto[];
}

export class BasicUserMetadataDto {
  @ApiProperty({ required: false, description: 'Dados do estudante, se role for STUDENT' })
  student?: BasicUserStudentDataDto;

  @ApiProperty({ required: false, description: 'Dados do orientador, se role for ADVISOR' })
  advisor?: BasicUserAdvisorDataDto;

  @ApiProperty({ required: false, description: 'Dados do coordenador, se role for COORDINATOR' })
  coordinator?: BasicUserCoordinatorDataDto;
}

export class BasicUserResponseDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Nome do usuário' })
  name: string;

  @ApiProperty({ description: 'Role do usuário', enum: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] })
  role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';

  @ApiProperty({ required: false, description: 'Metadados resumidos baseados no role do usuário' })
  metadata?: BasicUserMetadataDto;
}
