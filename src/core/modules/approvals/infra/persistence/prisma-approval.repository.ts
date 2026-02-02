import { Injectable } from '@nestjs/common';
import { Approval as PrismaApproval, Document as PrismaDocument } from '@prisma/client';
import { PrismaService } from '../../../../../database/prisma';
import { IApprovalRepository, GroupedDocumentApprovals, ApprovalItem, StudentInfo } from '../../application/ports';
import { Approval, ApprovalRole, ApprovalStatus } from '../../domain/entities';
import { ApprovalMapper } from './approval.mapper';

type DocumentWithRelations = PrismaDocument & {
  defense: {
    title: string;
    students: Array<{
      student: {
        registration: string;
        user: { name: string; email: string };
        course: { name: string };
      };
    }>;
  };
  approvals: Array<PrismaApproval & { approver: { name: string } | null }>;
};

const DOCUMENT_WITH_DEFENSE_INCLUDE = {
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
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class PrismaApprovalRepository implements IApprovalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(approval: Approval): Promise<Approval> {
    const created = await this.prisma.approval.create({
      data: {
        role: approval.role,
        status: approval.status,
        justification: approval.justification || null,
        approvedAt: approval.approvedAt || null,
        documentId: approval.documentId,
        approverId: approval.approverId || null,
      },
    });
    return ApprovalMapper.toDomain(created);
  }

  async update(approval: Approval): Promise<Approval> {
    const updated = await this.prisma.approval.update({
      where: { id: approval.id },
      data: {
        role: approval.role,
        status: approval.status,
        justification: approval.justification || null,
        approvedAt: approval.approvedAt || null,
        approverId: approval.approverId || null,
        cryptographicSignature: approval.cryptographicSignature || null,
        updatedAt: new Date(),
      },
    });
    return ApprovalMapper.toDomain(updated);
  }

  async findById(id: string): Promise<Approval | null> {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    return approval ? ApprovalMapper.toDomain(approval) : null;
  }

  async findByDocumentId(documentId: string): Promise<Approval[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });
    return approvals.map(ApprovalMapper.toDomain);
  }

  async findGroupedByCourseId(courseId: string): Promise<GroupedDocumentApprovals[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        nextVersion: null,
        defense: {
          students: {
            some: { student: { courseId } },
          },
        },
      },
      include: DOCUMENT_WITH_DEFENSE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return documents.map(doc => this.mapToGroupedApprovals(doc as DocumentWithRelations));
  }

  async findGroupedByParticipant(userId: string): Promise<GroupedDocumentApprovals[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        nextVersion: null,
        OR: [
          { defense: { students: { some: { studentId: userId } } } },
          { approvals: { some: { approverId: userId } } },
        ],
      },
      include: DOCUMENT_WITH_DEFENSE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return documents.map(doc => this.mapToGroupedApprovals(doc as DocumentWithRelations));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.approval.delete({ where: { id } });
  }

  private mapToGroupedApprovals(doc: DocumentWithRelations): GroupedDocumentApprovals {
    return {
      documentId: doc.id,
      documentTitle: doc.defense.title,
      students: this.mapStudents(doc.defense.students),
      courseName: doc.defense.students[0]?.student.course.name || 'N/A',
      createdAt: doc.createdAt,
      approvals: this.mapApprovals(doc.approvals),
    };
  }

  private mapStudents(students: DocumentWithRelations['defense']['students']): StudentInfo[] {
    return students.map(ds => ({
      name: ds.student.user.name,
      email: ds.student.user.email,
      registration: ds.student.registration,
    }));
  }

  private mapApprovals(approvals: DocumentWithRelations['approvals']): ApprovalItem[] {
    return approvals.map(approval => ({
      id: approval.id,
      role: approval.role as ApprovalRole,
      status: approval.status as ApprovalStatus,
      approverName: approval.approver?.name,
      approvedAt: approval.approvedAt || undefined,
      justification: approval.justification || undefined,
      approverId: approval.approverId || undefined,
    }));
  }
}
