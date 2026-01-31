import { ApiProperty } from '@nestjs/swagger';

export class DocumentVersionSummaryDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 'Correção de nota final após revisão', required: false })
  changeReason?: string;

  @ApiProperty({ example: '2024-01-08T10:00:00Z' })
  createdAt: Date;
}

export class CreateDocumentVersionResponseDto {
  @ApiProperty({
    example: 'Nova versão criada com sucesso. Versão 1 inativada, versão 2 aguardando aprovação.',
  })
  message: string;

  @ApiProperty({
    type: [DocumentVersionSummaryDto],
    description: 'Array com todas as versões do documento, ordenadas da mais recente para a mais antiga',
  })
  versions: DocumentVersionSummaryDto[];
}
