import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'CC-UFRGS', description: 'Código único do curso' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Ciência da Computação', description: 'Nome do curso' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'Instituto de Informática', description: 'Departamento do curso', required: false })
  @IsString()
  @IsOptional()
  departamento?: string;

  @ApiProperty({ example: true, description: 'Indica se o curso está ativo', default: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @ApiProperty({ example: 'uuid-da-organizacao', description: 'ID da organização' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ example: 'uuid-do-coordenador', description: 'ID do coordenador do curso', required: false })
  @IsUUID()
  @IsOptional()
  coordinatorId?: string;
}
