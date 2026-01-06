import { Document as PrismaDocument } from '@prisma/client';
import { Document, DocumentType, DocumentStatus } from '../../domain/entities';

export class DocumentMapper {
  static toDomain(prisma: PrismaDocument): Document {
    return Document.create(
      {
        type: prisma.type as DocumentType,
        version: prisma.version,
        documentHash: prisma.documentHash ?? undefined,
        documentCid: prisma.documentCid ?? undefined,
        status: prisma.status as DocumentStatus,
        changeReason: prisma.changeReason ?? undefined,
        inactivationReason: prisma.inactivationReason ?? undefined,
        inactivatedAt: prisma.inactivatedAt ?? undefined,
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
      type: doc.type,
      version: doc.version,
      documentHash: doc.documentHash ?? null,
      documentCid: doc.documentCid ?? null,
      status: doc.status,
      changeReason: doc.changeReason ?? null,
      inactivationReason: doc.inactivationReason ?? null,
      inactivatedAt: doc.inactivatedAt ?? null,
      blockchainTxId: doc.blockchainTxId ?? null,
      blockchainRegisteredAt: doc.blockchainRegisteredAt ?? null,
      defenseId: doc.defenseId,
      previousVersionId: doc.previousVersionId ?? null,
    };
  }
}
