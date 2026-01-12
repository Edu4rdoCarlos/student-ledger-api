import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreateDocumentDto {
  @IsNotEmpty()

  @ApiPropertyOptional({ example: 'abc123...', description: 'SHA-256 hash of the file content' })
  @IsOptional()
  @IsString()
  documentHash?: string;

  @ApiPropertyOptional({ example: 'QmXxx...', description: 'IPFS CID - filled when submitted to IPFS' })
  @IsOptional()
  @IsString()
  documentCid?: string;

  @ApiProperty({ example: 'uuid-da-defesa' })
  @IsUUID()
  @IsNotEmpty()
  defenseId: string;
}
