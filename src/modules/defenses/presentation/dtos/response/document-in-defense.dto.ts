import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentInDefenseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  version: number;

  @ApiPropertyOptional({ description: 'IPFS CID - filled when submitted to IPFS' })
  documentHash?: string;

  @ApiPropertyOptional({ description: 'MongoDB GridFS file ID' })
  mongoFileId?: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  blockchainTxId?: string;

  @ApiPropertyOptional()
  blockchainRegisteredAt?: Date;

  @ApiProperty()
  defenseId: string;

  @ApiPropertyOptional()
  previousVersionId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, description: 'Download URL (MongoDB with IPFS fallback). Only available for ADMIN, COORDINATOR, or participants when defense is APPROVED' })
  downloadUrl?: string;
}
