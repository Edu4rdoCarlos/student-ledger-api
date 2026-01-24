import { Document as PrismaDocument } from '@prisma/client';
import { Document, DocumentStatus } from '../../domain/entities';

export class DocumentMapper {
  static toDomain(prisma: PrismaDocument): Document {
    return Document.create(
      {
        version: prisma.version,
        minutesHash: prisma.minutesHash ?? undefined,
        minutesCid: prisma.minutesCid ?? undefined,
        evaluationHash: prisma.evaluationHash ?? undefined,
        evaluationCid: prisma.evaluationCid ?? undefined,
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
      version: doc.version,
      minutesHash: doc.minutesHash ?? null,
      minutesCid: doc.minutesCid ?? null,
      evaluationHash: doc.evaluationHash ?? null,
      evaluationCid: doc.evaluationCid ?? null,
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
