import { ApiProperty } from '@nestjs/swagger';
import { Defense } from '../../../domain/entities';
import { AdvisorInDefenseDto } from './advisor-in-defense.dto';
import { StudentInDefenseDto } from './student-in-defense.dto';
import { DocumentInDefenseDto } from './document-in-defense.dto';

export class ExamBoardMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class DefenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  defenseDate: Date;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  finalGrade?: number;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'FAILED'] })
  result: string;

  @ApiProperty({ enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'] })
  status: string;

  @ApiProperty({ type: AdvisorInDefenseDto })
  advisor: AdvisorInDefenseDto;

  @ApiProperty({ type: [StudentInDefenseDto] })
  students: StudentInDefenseDto[];

  @ApiProperty({ type: [ExamBoardMemberResponseDto], required: false })
  examBoard?: ExamBoardMemberResponseDto[];

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
      location: defense.location,
      finalGrade: defense.finalGrade,
      result: defense.result,
      status: defense.status,
      advisor: defense.advisor!,
      students: defense.students!,
      examBoard: defense.examBoard?.map(member => ({
        id: member.id!,
        name: member.name,
        email: member.email,
      })),
      documents: defense.documents,
      createdAt: defense.createdAt,
      updatedAt: defense.updatedAt,
    };
  }
}
