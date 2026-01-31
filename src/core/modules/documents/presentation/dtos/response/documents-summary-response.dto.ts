import { ApiProperty } from '@nestjs/swagger';

export class DocumentsSummaryResponseDto {
  @ApiProperty({ description: 'Total number of documents in the system' })
  totalDocuments: number;

  @ApiProperty({ description: 'Number of documents pending approval' })
  pendingDocuments: number;

  @ApiProperty({ description: 'Number of approved documents' })
  approvedDocuments: number;

  @ApiProperty({ description: 'Total number of students in the system' })
  totalStudents: number;
}
