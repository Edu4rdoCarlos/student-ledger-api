import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEmail, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class UpdateCoordinatorDto {
  @ApiProperty({ example: 'Prof. Dr. João Silva', description: 'Nome completo do coordenador' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso (obrigatório se ativo)' })
  @IsUUID('4', { message: 'ID do curso inválido' })
  @IsOptional()
  courseId: string;

  @ApiProperty({ example: true, description: 'Status de ativação do coordenador' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
