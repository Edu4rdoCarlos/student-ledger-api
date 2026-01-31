import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, DocumentStatus, DocumentType } from '../../../domain/entities';

export class DocumentResponseDto {
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

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

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

  static fromEntity(doc: Document): DocumentResponseDto {
    return {
      id: doc.id,
      version: doc.version,
      minutesHash: doc.minutesHash,
      minutesCid: doc.minutesCid,
      evaluationHash: doc.evaluationHash,
      evaluationCid: doc.evaluationCid,
      status: doc.status,
      blockchainTxId: doc.blockchainTxId,
      blockchainRegisteredAt: doc.blockchainRegisteredAt,
      defenseId: doc.defenseId,
      previousVersionId: doc.previousVersionId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export class DefenseInfoDto {
  @ApiProperty({ description: 'Nome(s) do(s) estudante(s)' })
  students: string[];

  @ApiProperty({ description: 'Nome do orientador' })
  advisor: string;

  @ApiProperty({ description: 'Nome do curso' })
  course: string;
}

export class BlockchainSignatureDto {
  @ApiProperty({ description: 'Papel do assinante' })
  role: 'coordenador' | 'orientador' | 'aluno' | 'coordenador_orientador';

  @ApiProperty({ description: 'Email do assinante' })
  email: string;

  @ApiProperty({ description: 'MSP ID da organização' })
  mspId: string;

  @ApiProperty({ description: 'Assinatura criptográfica em Base64' })
  signature: string;

  @ApiProperty({ description: 'Data/hora da assinatura' })
  timestamp: string;

  @ApiProperty({ description: 'Status da aprovação' })
  status: 'APPROVED' | 'REJECTED' | 'PENDING';

  @ApiPropertyOptional({ description: 'Justificativa (em caso de rejeição)' })
  justification?: string;
}

export class BlockchainDataDto {
  @ApiProperty({ description: 'Matrículas dos estudantes' })
  matriculas: string[];

  @ApiProperty({ description: 'Data da defesa' })
  defenseDate: string;

  @ApiProperty({ description: 'Nota final' })
  notaFinal: number;

  @ApiProperty({ description: 'Resultado da defesa' })
  resultado: 'APPROVED' | 'FAILED';

  @ApiProperty({ description: 'Versão do documento' })
  versao: number;

  @ApiProperty({ type: [BlockchainSignatureDto], description: 'Assinaturas dos participantes' })
  signatures: BlockchainSignatureDto[];

  @ApiProperty({ description: 'Data/hora da validação' })
  validatedAt: string;
}

export class SimpleDocumentDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ description: 'Type of document being validated (minutes or evaluation)', enum: DocumentType })
  documentType?: DocumentType;

  @ApiPropertyOptional({ description: 'SHA-256 hash of minutes file (Ata)' })
  minutesHash?: string;

  @ApiPropertyOptional({ description: 'IPFS CID of minutes file (Ata)' })
  minutesCid?: string;

  @ApiPropertyOptional({ description: 'SHA-256 hash of evaluation file (Avaliação de Desempenho)' })
  evaluationHash?: string;

  @ApiPropertyOptional({ description: 'IPFS CID of evaluation file (Avaliação de Desempenho)' })
  evaluationCid?: string;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus | string;

  @ApiPropertyOptional({ type: DefenseInfoDto, description: 'Informações da defesa associada' })
  defenseInfo?: DefenseInfoDto;

  @ApiPropertyOptional({ type: BlockchainDataDto, description: 'Dados registrados na blockchain' })
  blockchainData?: BlockchainDataDto;
}

export type ValidationStatus = 'NOT_FOUND' | 'PENDING' | 'APPROVED' | 'INACTIVE';

export class ValidateDocumentResponseDto {
  @ApiProperty({ description: 'Indica se o documento está registrado e válido na blockchain' })
  isValid: boolean;

  @ApiProperty({
    enum: ['NOT_FOUND', 'PENDING', 'APPROVED', 'INACTIVE'],
    description: 'Status do documento: NOT_FOUND (não existe), PENDING (aguardando aprovação), APPROVED (aprovado), INACTIVE (inativado)'
  })
  status: ValidationStatus;

  @ApiPropertyOptional({ type: SimpleDocumentDto })
  document?: SimpleDocumentDto;
}
