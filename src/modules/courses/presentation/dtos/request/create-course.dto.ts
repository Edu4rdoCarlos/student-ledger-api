import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'CC-UFRGS', description: 'Código único do curso' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Código do curso deve ter no mínimo 2 caracteres' })
  @MaxLength(50, { message: 'Código do curso deve ter no máximo 50 caracteres' })
  code: string;

  @ApiProperty({ example: 'Ciência da Computação', description: 'Nome do curso' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nome do curso deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome do curso deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({ example: 'uuid-do-departamento', description: 'ID do departamento', required: false })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ example: true, description: 'Indica se o curso está ativo', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ example: 'uuid-do-coordenador', description: 'ID do coordenador do curso', required: false })
  @IsUUID()
  @IsOptional()
  coordinatorId?: string;
}
