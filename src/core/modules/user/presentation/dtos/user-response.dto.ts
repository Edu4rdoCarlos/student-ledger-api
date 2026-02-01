import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CourseResponseDto } from '../../../courses/presentation/dtos';
import { DefenseResponseDto } from '../../../defenses/presentation/dtos/response/defense-response.dto';

export class UserStudentDataDto {
  @ApiProperty({ description: 'ID do usuário do estudante' })
  userId: string;

  @ApiProperty({ description: 'Matrícula do estudante' })
  registration: string;

  @ApiProperty({ required: false, description: 'Dados completos do curso' })
  course?: CourseResponseDto;

  @ApiProperty({ required: false, type: [DefenseResponseDto], description: 'Defesas do estudante' })
  defenses?: DefenseResponseDto[];
}

export class UserAdvisorDataDto {
  @ApiProperty({ description: 'ID do usuário do orientador' })
  userId: string;

  @ApiProperty({ required: false, description: 'Área de especialização' })
  specialization?: string;

  @ApiProperty({ required: false, description: 'Dados completos do curso' })
  course?: CourseResponseDto;

  @ApiProperty({ required: false, type: [DefenseResponseDto], description: 'Defesas que o orientador participa' })
  defenses?: DefenseResponseDto[];
}

export class UserCoordinatorDataDto {
  @ApiProperty({ description: 'ID do usuário do coordenador' })
  userId: string;

  @ApiProperty({ description: 'Status ativo/inativo' })
  isActive: boolean;

  @ApiProperty({ required: false, description: 'Dados completos do curso' })
  course?: CourseResponseDto;
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

  @ApiProperty({ description: 'Role do usuário', enum: Role })
  role: Role;

  @ApiProperty({ required: false, description: 'Metadados adicionais baseados no role do usuário' })
  metadata?: UserMetadataDto;
}
