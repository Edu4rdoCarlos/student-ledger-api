import { Document as PrismaDocument } from '@prisma/client';
import { Document, DocumentType, DocumentStatus } from '../../domain/entities';

export class DocumentMapper {
  static toDomain(prisma: PrismaDocument): Document {
    return Document.create(
      {
        tipo: prisma.tipo as DocumentType,
        versao: prisma.versao,
        documentoHash: prisma.documentoHash,
        arquivoPath: prisma.arquivoPath ?? undefined,
        status: prisma.status as DocumentStatus,
        motivoAlteracao: prisma.motivoAlteracao ?? undefined,
        motivoInativacao: prisma.motivoInativacao ?? undefined,
        dataInativacao: prisma.dataInativacao ?? undefined,
        blockchainTxId: prisma.blockchainTxId ?? undefined,
        blockchainRegisteredAt: prisma.blockchainRegisteredAt ?? undefined,
        defenseId: prisma.defenseId,
        previousVersionId: prisma.previousVersionId ?? undefined,
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      prisma.id,
    );
  }

  static toPrisma(doc: Document) {
    return {
      id: doc.id,
      tipo: doc.tipo,
      versao: doc.versao,
      documentoHash: doc.documentoHash,
      arquivoPath: doc.arquivoPath ?? null,
      status: doc.status,
      motivoAlteracao: doc.motivoAlteracao ?? null,
      motivoInativacao: doc.motivoInativacao ?? null,
      dataInativacao: doc.dataInativacao ?? null,
      blockchainTxId: doc.blockchainTxId ?? null,
      blockchainRegisteredAt: doc.blockchainRegisteredAt ?? null,
      defenseId: doc.defenseId,
      previousVersionId: doc.previousVersionId ?? null,
    };
  }
}
