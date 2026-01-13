import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalStatus } from '../../../domain/entities';

export class ListApprovalsQueryDto {
  @ApiPropertyOptional({
    enum: ApprovalStatus,
    description: 'Filter documents that have at least one approval with this status',
    example: ApprovalStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;
}
