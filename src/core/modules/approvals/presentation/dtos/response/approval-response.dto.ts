import { ApiProperty } from '@nestjs/swagger';
import { ApprovalRole, ApprovalStatus } from '../../../domain/entities';

export class ApprovalResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ enum: ApprovalRole, example: ApprovalRole.ADVISOR })
  role!: ApprovalRole;

  @ApiProperty({ enum: ApprovalStatus, example: ApprovalStatus.PENDING })
  status!: ApprovalStatus;

  @ApiProperty({ required: false, example: 'Documento contém erros' })
  justification?: string;

  @ApiProperty({ required: false, example: '2026-01-12T10:00:00Z' })
  approvedAt?: Date;

  @ApiProperty({ example: '2026-01-05T10:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-05T10:00:00Z' })
  updatedAt!: Date;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  documentId!: string;

  @ApiProperty({ required: false, example: '550e8400-e29b-41d4-a716-446655440002' })
  approverId?: string;
}
