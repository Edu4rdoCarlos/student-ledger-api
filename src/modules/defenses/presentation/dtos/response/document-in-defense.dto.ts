import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentInDefenseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  version: number;

  @ApiPropertyOptional({ description: 'SHA-256 hash of minutes file (Ata)' })
  minutesHash?: string;

  @ApiPropertyOptional({ description: 'IPFS CID of minutes file (Ata)' })
  minutesCid?: string;

  @ApiPropertyOptional({ description: 'SHA-256 hash of evaluation file (Avaliação de Desempenho)' })
  evaluationHash?: string;

  @ApiPropertyOptional({ description: 'IPFS CID of evaluation file (Avaliação de Desempenho)' })
  evaluationCid?: string;

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
}
