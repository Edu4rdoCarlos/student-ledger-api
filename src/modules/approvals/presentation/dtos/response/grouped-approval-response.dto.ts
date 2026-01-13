import { ApiProperty } from '@nestjs/swagger';
import { ApprovalRole, ApprovalStatus } from '../../../domain/entities';

export class ApprovalItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ enum: ApprovalRole, example: ApprovalRole.ADVISOR })
  role!: ApprovalRole;

  @ApiProperty({ enum: ApprovalStatus, example: ApprovalStatus.PENDING })
  status!: ApprovalStatus;

  @ApiProperty({ required: false, example: 'João Silva' })
  approverName?: string;

  @ApiProperty({ required: false, example: '2026-01-12T10:00:00Z' })
  approvedAt?: Date;

  @ApiProperty({ required: false, example: 'Documento contém erros' })
  justification?: string;

  @ApiProperty({ required: false, example: '550e8400-e29b-41d4-a716-446655440002' })
  approverId?: string;
}

export class StudentInfoDto {
  @ApiProperty({ example: 'Maria Santos' })
  name!: string;

  @ApiProperty({ example: 'maria.santos@example.com' })
  email!: string;

  @ApiProperty({ example: '2021001' })
  registration!: string;
}

export class GroupedApprovalResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Document ID' })
  documentId!: string;

  @ApiProperty({ example: 'Ata de Defesa - TCC Final', description: 'Defense title' })
  documentTitle!: string;

  @ApiProperty({ type: [StudentInfoDto], description: 'List of students involved in the defense' })
  students!: StudentInfoDto[];

  @ApiProperty({ example: 'Engenharia de Software', description: 'Course name' })
  courseName!: string;

  @ApiProperty({ example: '2026-01-05T10:00:00Z', description: 'Document creation date' })
  createdAt!: Date;

  @ApiProperty({ type: [ApprovalItemDto], description: 'All approvals for this document' })
  approvals!: ApprovalItemDto[];

  @ApiProperty({
    example: { total: 3, approved: 1, pending: 2, rejected: 0 },
    description: 'Summary of approval statuses'
  })
  summary!: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}
