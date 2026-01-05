import { ApiProperty } from '@nestjs/swagger';
import { Defense } from '../../../domain/entities';
import { AdvisorInDefenseDto } from './advisor-in-defense.dto';
import { StudentInDefenseDto } from './student-in-defense.dto';
import { DocumentInDefenseDto } from './document-in-defense.dto';

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

  @ApiProperty({ type: AdvisorInDefenseDto })
  advisor: AdvisorInDefenseDto;

  @ApiProperty({ type: [StudentInDefenseDto] })
  students: StudentInDefenseDto[];

  @ApiProperty({ type: [DocumentInDefenseDto], required: false })
  documents?: DocumentInDefenseDto[];

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  static fromEntity(defense: Defense): DefenseResponseDto {
    return {
      id: defense.id,
      title: defense.title,
      defenseDate: defense.defenseDate,
      finalGrade: defense.finalGrade,
      result: defense.result,
      advisor: defense.advisor!,
      students: defense.students!,
      documents: defense.documents,
      createdAt: defense.createdAt,
      updatedAt: defense.updatedAt,
    };
  }
}
