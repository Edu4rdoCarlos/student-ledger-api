import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentSchema {
  @ApiProperty({
    description: 'ID único do documento',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo do documento',
    enum: ['ATA', 'FICHA'],
    example: 'ATA',
  })
  tipo: string;

  @ApiProperty({
    description: 'Versão do documento',
    example: 1,
  })
  versao: number;

  @ApiPropertyOptional({
    description: 'Hash SHA-256 do conteúdo do arquivo',
    example: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
  })
  documentHash?: string;

  @ApiPropertyOptional({
    description: 'IPFS CID (Content Identifier)',
    example: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
  })
  documentCid?: string;

  @ApiProperty({
    description: 'Status do documento',
    enum: ['PENDING', 'APPROVED', 'INACTIVE'],
    example: 'PENDING',
  })
  status: string;

  @ApiProperty({
    description: 'ID da defesa associada',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  defenseId: string;

  @ApiPropertyOptional({
    description: 'ID da transação na blockchain',
    example: 'tx_abc123...',
  })
  blockchainTxId?: string;

  @ApiPropertyOptional({
    description: 'Data de registro na blockchain',
    example: '2024-01-15T10:30:00.000Z',
  })
  blockchainRegisteredAt?: Date;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class ValidateDocumentSchema {
  @ApiProperty({
    description: 'Indica se o documento é válido',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Mensagem sobre a validação',
    example: 'Documento válido e registrado na blockchain',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Dados do documento (se encontrado)',
    type: DocumentSchema,
  })
  document?: DocumentSchema;
}
