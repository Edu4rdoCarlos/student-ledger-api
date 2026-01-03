import { ApiProperty } from '@nestjs/swagger';
import { Defense } from '../../../domain/entities';

export class DefenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  defenseDate: Date;

  @ApiProperty({ required: false })
  finalGrade?: number;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'FAILED'] })
  result: string;

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
      title: defense.title,
      defenseDate: defense.defenseDate,
      finalGrade: defense.finalGrade,
      result: defense.result,
      advisorId: defense.advisorId,
      studentIds: defense.studentIds,
      createdAt: defense.createdAt,
      updatedAt: defense.updatedAt,
    };
  }
}
