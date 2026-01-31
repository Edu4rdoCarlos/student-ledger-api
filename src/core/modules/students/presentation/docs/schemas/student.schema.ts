import { ApiProperty } from '@nestjs/swagger';

export class StudentSchema {
  @ApiProperty({
    description: 'ID único do estudante',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Matrícula do estudante',
    example: '2021001234',
  })
  matricula: string;

  @ApiProperty({
    description: 'Nome completo do estudante',
    example: 'João da Silva',
  })
  nome: string;

  @ApiProperty({
    description: 'Email institucional do estudante',
    example: 'joao.silva@universidade.edu.br',
  })
  email: string;

  @ApiProperty({
    description: 'ID do curso',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  courseId: string;

  @ApiProperty({
    description: 'ID da organização',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
