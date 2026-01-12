import { ApiProperty } from '@nestjs/swagger';
import { CourseInfo } from './student-response.dto';

export class StudentListItemDto {
  @ApiProperty({ description: 'ID do usuário do estudante' })
  userId: string;

  @ApiProperty({ description: 'Matrícula do estudante' })
  registration: string;

  @ApiProperty({ description: 'Nome do estudante' })
  name: string;

  @ApiProperty({ description: 'Email do estudante' })
  email: string;

  @ApiProperty({
    description: 'Informações do curso',
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID do curso' },
      name: { type: 'string', description: 'Nome do curso' },
      code: { type: 'string', description: 'Código do curso' },
    },
  })
  course: CourseInfo;

  @ApiProperty({
    description: 'Quantidade de defesas registradas',
    example: 2
  })
  defensesCount: number;

  @ApiProperty({
    description: 'Status do estudante em relação às defesas',
    enum: ['NO_DEFENSE', 'APPROVED', 'FAILED', 'PENDING', 'UNDER_APPROVAL'],
    example: 'APPROVED'
  })
  status: 'NO_DEFENSE' | 'APPROVED' | 'FAILED' | 'PENDING' | 'UNDER_APPROVAL';
}
