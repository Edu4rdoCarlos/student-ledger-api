import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateDepartmentDto {
  @ApiProperty({ example: 'Instituto de Informática', description: 'Nome do departamento' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
