import { ApiProperty } from '@nestjs/swagger';
import { ApprovalRole, ApprovalStatus } from '../../../domain/entities';

export class SignatureDto {
  @ApiProperty({ enum: ApprovalRole, example: ApprovalRole.ADVISOR })
  role!: ApprovalRole;

  @ApiProperty({ enum: ApprovalStatus, example: ApprovalStatus.APPROVED })
  status!: ApprovalStatus;

  @ApiProperty({ required: false, example: 'João Silva' })
  approverName?: string;

  @ApiProperty({ required: false, example: '2026-01-12T10:00:00Z' })
  approvedAt?: Date;

  @ApiProperty({ required: false, example: 'Documento contém erros' })
  justification?: string;
}

export class StudentDto {
  @ApiProperty({ example: 'Maria Santos' })
  name!: string;

  @ApiProperty({ example: 'maria.santos@example.com' })
  email!: string;

  @ApiProperty({ example: '2021001' })
  registration!: string;
}

export class PendingApprovalResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ enum: ApprovalRole, example: ApprovalRole.ADVISOR })
  role!: ApprovalRole;

  @ApiProperty({ enum: ApprovalStatus, example: ApprovalStatus.PENDING })
  status!: ApprovalStatus;

  @ApiProperty({ example: '2026-01-05T10:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Document ID' })
  documentId!: string;

  @ApiProperty({ example: 'Ata de Defesa - TCC Final', description: 'Defense title' })
  documentTitle!: string;

  @ApiProperty({ type: [StudentDto], description: 'List of students involved in the defense' })
  students!: StudentDto[];

  @ApiProperty({ example: 'Engenharia de Software', description: 'Course name' })
  courseName!: string;

  @ApiProperty({ type: [SignatureDto], description: 'All signatures for this document' })
  signatures!: SignatureDto[];

  @ApiProperty({ required: false, example: '550e8400-e29b-41d4-a716-446655440002' })
  approverId?: string;
}
