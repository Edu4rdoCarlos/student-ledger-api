import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateCoordinatorDto {
  @ApiProperty({ example: 'coordenador@universidade.edu.br', description: 'Email do coordenador' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Prof. Dr. João Silva', description: 'Nome completo do coordenador' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso (obrigatório)' })
  @IsUUID()
  @IsNotEmpty({ message: 'Coordenador deve estar obrigatoriamente alocado em um curso' })
  courseId: string;

  @ApiProperty({ example: 'uuid-da-organizacao', description: 'ID da organização', required: false })
  @IsUUID()
  organizationId?: string;
}
