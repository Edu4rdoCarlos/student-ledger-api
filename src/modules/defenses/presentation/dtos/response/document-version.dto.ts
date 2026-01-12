import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentVersionDto {
  @ApiProperty({ example: 'uuid-here', description: 'Document version ID' })
  id: string;

  @ApiProperty({ example: 1, description: 'Version number' })
  version: number;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'APPROVED', 'INACTIVE'], description: 'Document status' })
  status: string;

  @ApiPropertyOptional({ example: 'Correção de nota final após revisão', description: 'Reason for creating this version' })
  changeReason?: string;

  @ApiPropertyOptional({ example: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco', description: 'IPFS CID for document storage' })
  documentCid?: string;

  @ApiPropertyOptional({ example: 'tx_abc123def456', description: 'Blockchain transaction ID' })
  blockchainTxId?: string;

  @ApiPropertyOptional({ example: '2024-01-08T14:00:00Z', description: 'When document was registered on blockchain' })
  blockchainRegisteredAt?: Date;

  @ApiProperty({ example: '2024-01-08T10:00:00Z', description: 'Version creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Download URL (IPFS). Only available for ADMIN, COORDINATOR, or participants when defense is APPROVED' })
  downloadUrl?: string;
}
