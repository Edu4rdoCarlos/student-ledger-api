import { ApiProperty } from '@nestjs/swagger';
import { Defense } from '../../../domain/entities';

export class DefenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  titulo: string;

  @ApiProperty()
  dataDefesa: Date;

  @ApiProperty({ required: false })
  notaFinal?: number;

  @ApiProperty({ enum: ['PENDENTE', 'APROVADO', 'REPROVADO'] })
  resultado: string;

  @ApiProperty()
  advisorId: string;

  @ApiProperty({ type: [String] })
  studentIds: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(defense: Defense): DefenseResponseDto {
    return {
      id: defense.id,
      titulo: defense.titulo,
      dataDefesa: defense.dataDefesa,
      notaFinal: defense.notaFinal,
      resultado: defense.resultado,
      advisorId: defense.advisorId,
      studentIds: defense.studentIds,
      createdAt: defense.createdAt,
      updatedAt: defense.updatedAt,
    };
  }
}
