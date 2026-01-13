import { ApiProperty } from '@nestjs/swagger';
import { Defense } from '../../../domain/entities';

export class DefenseListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  defenseDate: Date;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'FAILED'] })
  result: string;

  @ApiProperty({ enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'] })
  status: string;

  @ApiProperty({ description: 'Nome do orientador' })
  advisorName: string;

  @ApiProperty({ description: 'Nomes dos estudantes', type: [String] })
  studentNames: string[];

  static fromEntity(defense: Defense): DefenseListItemDto {
    return {
      id: defense.id,
      title: defense.title,
      defenseDate: defense.defenseDate,
      result: defense.result,
      status: defense.status,
      advisorName: defense.advisor?.name || '',
      studentNames: defense.students?.map(s => s.name) || [],
    };
  }
}
