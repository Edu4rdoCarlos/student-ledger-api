import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentInDefenseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  version: number;

  @ApiPropertyOptional({ description: 'SHA-256 hash of the file content' })
  documentHash?: string;

  @ApiPropertyOptional({ description: 'IPFS CID' })
  documentCid?: string;

  @ApiProperty()
  status: string;

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
}
