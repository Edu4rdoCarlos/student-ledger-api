import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MinLength, MaxLength, IsBoolean } from 'class-validator';

export class UpdateAdvisorDto {
  @ApiProperty({ example: 'Prof. Dr. João Silva Santos', description: 'Nome completo do orientador', required: false })
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name?: string;

  @ApiProperty({ example: 'Machine Learning', description: 'Área de especialização do orientador', required: false })
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Especialização deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Especialização deve ter no máximo 200 caracteres' })
  specialization?: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso', required: false })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiProperty({ example: true, description: 'Indica se o orientador está ativo', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
