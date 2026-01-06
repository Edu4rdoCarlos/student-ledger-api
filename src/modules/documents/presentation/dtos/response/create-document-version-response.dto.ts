import { ApiProperty } from '@nestjs/swagger';

class DocumentVersionSummaryDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({ example: 'INACTIVE' })
  status: string;
}

class NewDocumentVersionSummaryDto extends DocumentVersionSummaryDto {
  @ApiProperty({ example: 'Correção de nota final após revisão' })
  changeReason?: string;
}

export class CreateDocumentVersionResponseDto {
  @ApiProperty({
    example: 'Nova versão criada com sucesso. Versão 1 inativada, versão 2 aguardando aprovação.',
  })
  message: string;

  @ApiProperty({ type: DocumentVersionSummaryDto })
  previousVersion: DocumentVersionSummaryDto;

  @ApiProperty({ type: NewDocumentVersionSummaryDto })
  newVersion: NewDocumentVersionSummaryDto;
}
