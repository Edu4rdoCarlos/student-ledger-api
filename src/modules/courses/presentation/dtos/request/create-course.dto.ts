import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'CC-UFRGS', description: 'Código único do curso' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Ciência da Computação', description: 'Nome do curso' })
  @IsString()
  @IsNotEmpty()
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
