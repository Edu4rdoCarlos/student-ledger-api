import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreateDocumentDto {
  @ApiPropertyOptional({ example: 'abc123...', description: 'SHA-256 hash of minutes file (Ata)' })
  @IsOptional()
  @IsString()
  minutesHash?: string;

  @ApiPropertyOptional({ example: 'QmXxx...', description: 'IPFS CID of minutes file (Ata)' })
  @IsOptional()
  @IsString()
  minutesCid?: string;

  @ApiPropertyOptional({ example: 'def456...', description: 'SHA-256 hash of evaluation file (Avaliação de Desempenho)' })
  @IsOptional()
  @IsString()
  evaluationHash?: string;

  @ApiPropertyOptional({ example: 'bafyXxx...', description: 'IPFS CID of evaluation file (Avaliação de Desempenho)' })
  @IsOptional()
  @IsString()
  evaluationCid?: string;

  @ApiProperty({ example: 'uuid-da-defesa' })
  @IsUUID()
  @IsNotEmpty()
  defenseId: string;
}
