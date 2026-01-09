import { ApiProperty } from '@nestjs/swagger';

export class UserStudentDataDto {
  @ApiProperty({ description: 'ID do usuário do estudante' })
  userId: string;

  @ApiProperty({ description: 'Matrícula do estudante' })
  registration: string;

  @ApiProperty({ description: 'ID do curso' })
  courseId: string;
}

export class UserAdvisorDataDto {
  @ApiProperty({ description: 'ID do usuário do orientador' })
  userId: string;

  @ApiProperty({ required: false, description: 'ID do departamento' })
  departmentId?: string;

  @ApiProperty({ required: false, description: 'Área de especialização' })
  specialization?: string;

  @ApiProperty({ required: false, description: 'ID do curso' })
  courseId?: string;
}

export class UserCoordinatorDataDto {
  @ApiProperty({ description: 'ID do usuário do coordenador' })
  userId: string;

  @ApiProperty({ description: 'ID do curso' })
  courseId: string;

  @ApiProperty({ description: 'Status ativo/inativo' })
  isActive: boolean;
}

export class UserMetadataDto {
  @ApiProperty({ required: false, description: 'Dados do estudante, se role for STUDENT' })
  student?: UserStudentDataDto;

  @ApiProperty({ required: false, description: 'Dados do orientador, se role for ADVISOR' })
  advisor?: UserAdvisorDataDto;

  @ApiProperty({ required: false, description: 'Dados do coordenador, se role for COORDINATOR' })
  coordinator?: UserCoordinatorDataDto;
}

export class UserResponseDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Nome do usuário' })
  name: string;

  @ApiProperty({ description: 'Role do usuário', enum: ['ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT'] })
  role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';

  @ApiProperty({ required: false, description: 'Metadados adicionais baseados no role do usuário' })
  metadata?: UserMetadataDto;
}
