import { ApiProperty } from '@nestjs/swagger';
import { Department } from '../../../domain/entities';

export class DepartmentResponseDto {
  @ApiProperty({ description: 'ID do departamento' })
  id: string;

  @ApiProperty({ description: 'Nome do departamento' })
  name: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  static fromEntity(department: Department): DepartmentResponseDto {
    const dto = new DepartmentResponseDto();
    dto.id = department.id;
    dto.name = department.name;
    dto.createdAt = department.createdAt;
    dto.updatedAt = department.updatedAt;
    return dto;
  }
}
