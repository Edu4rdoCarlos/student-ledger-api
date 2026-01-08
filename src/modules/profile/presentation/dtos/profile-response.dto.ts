import { ApiProperty } from '@nestjs/swagger';

export class ProfileStudentDataDto {
  @ApiProperty({ description: 'ID do estudante' })
  id: string;

  @ApiProperty({ description: 'Matrícula do estudante' })
  registration: string;

  @ApiProperty({ description: 'ID do curso' })
  courseId: string;
}

export class ProfileAdvisorDataDto {
  @ApiProperty({ description: 'ID do orientador' })
  id: string;

  @ApiProperty({ required: false, description: 'ID do departamento' })
  departmentId?: string;

  @ApiProperty({ required: false, description: 'Área de especialização' })
  specialization?: string;

  @ApiProperty({ required: false, description: 'ID do curso' })
  courseId?: string;
}

export class ProfileCoordinatorDataDto {
  @ApiProperty({ description: 'ID do coordenador' })
  id: string;

  @ApiProperty({ description: 'ID do curso' })
  courseId: string;

  @ApiProperty({ description: 'Status ativo/inativo' })
  isActive: boolean;
}

export class ProfileMetadataDto {
  @ApiProperty({ required: false, description: 'Dados do estudante, se role for STUDENT' })
  student?: ProfileStudentDataDto;

  @ApiProperty({ required: false, description: 'Dados do orientador, se role for ADVISOR' })
  advisor?: ProfileAdvisorDataDto;

  @ApiProperty({ required: false, description: 'Dados do coordenador, se role for COORDINATOR' })
  coordinator?: ProfileCoordinatorDataDto;
}

export class ProfileResponseDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Nome do usuário' })
  name: string;

  @ApiProperty({ description: 'Role do usuário', enum: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] })
  role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';

  @ApiProperty({ required: false, description: 'Metadados adicionais baseados no role do usuário' })
  metadata?: ProfileMetadataDto;
}
