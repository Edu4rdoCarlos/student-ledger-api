import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @ApiProperty({ example: 'Instituto de Informática', description: 'Nome do departamento' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nome do departamento deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome do departamento deve ter no máximo 200 caracteres' })
  name: string;
}
