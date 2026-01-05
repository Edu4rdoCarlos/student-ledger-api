import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({ example: 'Ciência da Computação', description: 'Nome do curso', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'uuid-do-departamento', description: 'ID do departamento', required: false })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ example: true, description: 'Indica se o curso está ativo', required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ example: 'uuid-do-coordenador', description: 'ID do coordenador do curso', required: false })
  @IsUUID()
  @IsOptional()
  coordinatorId?: string;
}
