import { Approval as PrismaApproval } from '@prisma/client';
import { Approval, ApprovalRole, ApprovalStatus } from '../../domain/entities';

export class ApprovalMapper {
  static toDomain(prismaApproval: PrismaApproval): Approval {
    return Approval.create({
      id: prismaApproval.id,
      role: prismaApproval.role as ApprovalRole,
      status: prismaApproval.status as ApprovalStatus,
      justification: prismaApproval.justification || undefined,
      approvedAt: prismaApproval.approvedAt || undefined,
      createdAt: prismaApproval.createdAt,
      updatedAt: prismaApproval.updatedAt,
      documentId: prismaApproval.documentId,
      approverId: prismaApproval.approverId || undefined,
    });
  }

  static toPrisma(approval: Approval): PrismaApproval {
    return {
      id: approval.id || '',
      role: approval.role,
      status: approval.status,
      justification: approval.justification || null,
      approvedAt: approval.approvedAt || null,
      createdAt: approval.createdAt || new Date(),
      updatedAt: approval.updatedAt || new Date(),
      documentId: approval.documentId,
      approverId: approval.approverId || null,
    };
  }
}
