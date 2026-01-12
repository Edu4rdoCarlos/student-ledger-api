import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma';
import { IApprovalRepository } from '../../application/ports';
import { Approval } from '../../domain/entities';
import { ApprovalMapper } from './approval.mapper';

@Injectable()
export class PrismaApprovalRepository implements IApprovalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(approval: Approval): Promise<Approval> {
    const data = {
      role: approval.role,
      status: approval.status,
      justification: approval.justification || null,
      approvedAt: approval.approvedAt || null,
      documentId: approval.documentId,
      approverId: approval.approverId || null,
    };

    const created = await this.prisma.approval.create({ data });
    return ApprovalMapper.toDomain(created);
  }

  async update(approval: Approval): Promise<Approval> {
    const data = {
      role: approval.role,
      status: approval.status,
      justification: approval.justification || null,
      approvedAt: approval.approvedAt || null,
      approverId: approval.approverId || null,
      updatedAt: new Date(),
    };

    const updated = await this.prisma.approval.update({
      where: { id: approval.id },
      data,
    });

    return ApprovalMapper.toDomain(updated);
  }

  async findById(id: string): Promise<Approval | null> {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
    });

    return approval ? ApprovalMapper.toDomain(approval) : null;
  }

  async findByDocumentId(documentId: string): Promise<Approval[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });

    return approvals.map(ApprovalMapper.toDomain);
  }

  async findPendingByDocumentId(documentId: string): Promise<Approval[]> {
    const approvals = await this.prisma.approval.findMany({
      where: {
        documentId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    });

    return approvals.map(ApprovalMapper.toDomain);
  }

  async findAllPending(): Promise<Approval[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { status: 'PENDING' },
      include: {
        document: {
          include: {
            defense: {
              include: {
                advisor: true,
                students: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return approvals.map(ApprovalMapper.toDomain);
  }

  async findPendingByUserId(userId: string): Promise<Approval[]> {
    const approvals = await this.prisma.approval.findMany({
      where: {
        status: 'PENDING',
        document: {
          defense: {
            OR: [
              { advisorId: userId },
              { students: { some: { id: userId } } },
            ],
          },
        },
      },
      include: {
        document: {
          include: {
            defense: {
              include: {
                advisor: true,
                students: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return approvals.map(ApprovalMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.approval.delete({
      where: { id },
    });
  }
}
