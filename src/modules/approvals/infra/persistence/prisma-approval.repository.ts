import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma';
import { IApprovalRepository, ApprovalWithDetails } from '../../application/ports';
import { Approval, ApprovalRole, ApprovalStatus } from '../../domain/entities';
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

  async findAllPendingWithDetails(): Promise<ApprovalWithDetails[]> {
    // Buscar documentos que têm pelo menos uma aprovação pendente
    const documents = await this.prisma.document.findMany({
      where: {
        approvals: {
          some: {
            status: 'PENDING',
          },
        },
      },
      include: {
        defense: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    user: true,
                    course: true,
                  },
                },
              },
            },
          },
        },
        approvals: {
          include: {
            approver: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => {
      // Pegar a primeira aprovação pendente para usar como referência
      const firstPendingApproval = doc.approvals.find((a) => a.status === 'PENDING')!;

      return {
        approval: ApprovalMapper.toDomain(firstPendingApproval),
        documentTitle: doc.defense.title,
        students: doc.defense.students.map((ds) => ({
          name: ds.student.user.name,
          email: ds.student.user.email,
          registration: ds.student.registration,
        })),
        courseName: doc.defense.students[0]?.student.course.name || 'N/A',
        allSignatures: doc.approvals.map((sig) => ({
          role: sig.role as ApprovalRole,
          status: sig.status as ApprovalStatus,
          approverName: sig.approver?.name,
          approvedAt: sig.approvedAt || undefined,
          justification: sig.justification || undefined,
        })),
      };
    });
  }

  async findPendingByUserIdWithDetails(userId: string): Promise<ApprovalWithDetails[]> {
    // Buscar documentos que têm pelo menos uma aprovação pendente relacionada ao usuário
    const documents = await this.prisma.document.findMany({
      where: {
        approvals: {
          some: {
            status: 'PENDING',
            OR: [
              { approverId: userId },
              {
                approverId: null,
                document: {
                  defense: {
                    OR: [
                      { advisorId: userId },
                      { students: { some: { studentId: userId } } },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      include: {
        defense: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    user: true,
                    course: true,
                  },
                },
              },
            },
          },
        },
        approvals: {
          include: {
            approver: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => {
      // Pegar a primeira aprovação pendente relacionada ao usuário
      const firstPendingApproval = doc.approvals.find(
        (a) =>
          a.status === 'PENDING' &&
          (a.approverId === userId || a.approverId === null),
      )!;

      return {
        approval: ApprovalMapper.toDomain(firstPendingApproval),
        documentTitle: doc.defense.title,
        students: doc.defense.students.map((ds) => ({
          name: ds.student.user.name,
          email: ds.student.user.email,
          registration: ds.student.registration,
        })),
        courseName: doc.defense.students[0]?.student.course.name || 'N/A',
        allSignatures: doc.approvals.map((sig) => ({
          role: sig.role as ApprovalRole,
          status: sig.status as ApprovalStatus,
          approverName: sig.approver?.name,
          approvedAt: sig.approvedAt || undefined,
          justification: sig.justification || undefined,
        })),
      };
    });
  }
}
