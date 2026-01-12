import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({ example: 'Ciência da Computação', description: 'Nome do curso', required: false })
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Nome do curso deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome do curso deve ter no máximo 200 caracteres' })
  name?: string;

  @ApiProperty({ example: true, description: 'Indica se o curso está ativo', required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ example: 'uuid-do-coordenador', description: 'ID do coordenador do curso', required: false })
  @IsUUID()
  @IsOptional()
  coordinatorId?: string;
}
