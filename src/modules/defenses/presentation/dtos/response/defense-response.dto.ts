import { ApiProperty } from '@nestjs/swagger';
import { Defense } from '../../../domain/entities';
import { AdvisorInDefenseDto } from './advisor-in-defense.dto';
import { StudentInDefenseDto } from './student-in-defense.dto';

export class ExamBoardMemberResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class DocumentApprovalDto {
  @ApiProperty({ description: 'Role do aprovador' })
  role: string;

  @ApiProperty({ description: 'Email do aprovador' })
  email: string;

  @ApiProperty({ description: 'Data e hora da aprovação' })
  timestamp?: Date;

  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'PENDING'], description: 'Status da aprovação' })
  status: string;

  @ApiProperty({ required: false, description: 'Justificativa em caso de rejeição' })
  justification?: string;

  @ApiProperty({ required: false, description: 'ID do aprovador' })
  approverId?: string;

  @ApiProperty({ required: false, description: 'Nome do aprovador' })
  approverName?: string;
}

export class DocumentWithApprovalsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  version: number;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE'] })
  status: string;

  @ApiProperty({ required: false })
  changeReason?: string;

  @ApiProperty({ required: false })
  documentCid?: string;

  @ApiProperty({ required: false })
  blockchainRegisteredAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [DocumentApprovalDto], required: false, description: 'Aprovações e assinaturas do documento' })
  signatures?: DocumentApprovalDto[];
}

export class CourseInDefenseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
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

  @ApiProperty({ enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'], description: 'Defense status' })
  status: string;

  @ApiProperty({ type: AdvisorInDefenseDto })
  advisor: AdvisorInDefenseDto;

  @ApiProperty({ type: [StudentInDefenseDto] })
  students: StudentInDefenseDto[];

  @ApiProperty({ type: CourseInDefenseDto, description: 'Curso da defesa' })
  course: CourseInDefenseDto;

  @ApiProperty({ type: [ExamBoardMemberResponseDto], required: false, description: 'Banca examinadora' })
  examBoard?: ExamBoardMemberResponseDto[];

  @ApiProperty({
    type: [DocumentWithApprovalsDto],
    required: false,
    description: 'Documentos da defesa com assinaturas e aprovações, ordenados do mais recente para o mais antigo'
  })
  documents?: DocumentWithApprovalsDto[];

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  static fromEntity(defense: Defense): DefenseResponseDto {
    const firstStudent = defense.students?.[0];
    const course = firstStudent?.course || { id: '', code: '', name: '' };

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
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
      },
      examBoard: defense.examBoard?.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
      })),
      documents: defense.documents?.map(doc => ({
        id: doc.id,
        version: doc.version,
        status: doc.status,
        changeReason: doc.changeReason,
        documentCid: doc.documentCid,
        blockchainRegisteredAt: doc.blockchainRegisteredAt,
        createdAt: doc.createdAt,
        signatures: doc.approvals?.map(approval => ({
          role: approval.role,
          email: approval.approver?.email || '',
          timestamp: approval.approvedAt,
          status: approval.status,
          justification: approval.justification,
          approverId: approval.approverId,
          approverName: approval.approver?.name,
        })),
      })),
      createdAt: defense.createdAt,
      updatedAt: defense.updatedAt,
    };
  }
}
