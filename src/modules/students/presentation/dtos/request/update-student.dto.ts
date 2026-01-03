import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateStudentDto {
  @ApiProperty({ example: 'João da Silva Santos', description: 'Nome completo do aluno', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso', required: false })
  @IsUUID()
  @IsOptional()
  courseId?: string;
}
