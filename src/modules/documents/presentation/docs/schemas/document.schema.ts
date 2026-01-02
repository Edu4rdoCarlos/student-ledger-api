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

  @ApiProperty({
    description: 'Hash SHA-256 do documento',
    example: 'a1b2c3d4e5f6...',
  })
  documentoHash: string;

  @ApiPropertyOptional({
    description: 'Caminho do arquivo',
    example: '/uploads/documents/ata-2024.pdf',
  })
  arquivoPath?: string;

  @ApiProperty({
    description: 'Status do documento',
    enum: ['PENDENTE', 'APROVADO', 'INATIVO'],
    example: 'PENDENTE',
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
