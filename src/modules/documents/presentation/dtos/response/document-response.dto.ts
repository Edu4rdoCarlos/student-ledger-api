import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, DocumentStatus } from '../../../domain/entities';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;


  @ApiProperty()
  version: number;

  @ApiPropertyOptional({ description: 'SHA-256 hash of the file content' })
  documentHash?: string;

  @ApiPropertyOptional({ description: 'IPFS CID - filled when submitted to IPFS' })
  documentCid?: string;

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
      documentHash: doc.documentHash,
      documentCid: doc.documentCid,
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

  @ApiPropertyOptional({ description: 'SHA-256 hash of the file content' })
  documentHash?: string;

  @ApiPropertyOptional({ description: 'IPFS CID' })
  documentCid?: string;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus | string;

  @ApiPropertyOptional({ type: DefenseInfoDto, description: 'Informações da defesa associada' })
  defenseInfo?: DefenseInfoDto;

  @ApiPropertyOptional({ type: BlockchainDataDto, description: 'Dados registrados na blockchain' })
  blockchainData?: BlockchainDataDto;
}

export class ValidateDocumentResponseDto {
  @ApiProperty()
  isValid: boolean;

  @ApiPropertyOptional({ type: SimpleDocumentDto })
  document?: SimpleDocumentDto;

  @ApiProperty()
  message: string;
}
