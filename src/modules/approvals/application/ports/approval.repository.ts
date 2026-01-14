import { Approval, ApprovalRole, ApprovalStatus } from '../../domain/entities';

export const APPROVAL_REPOSITORY = Symbol('APPROVAL_REPOSITORY');

export interface StudentInfo {
  name: string;
  email: string;
  registration: string;
}

export interface ApprovalWithDetails {
  approval: Approval;
  documentTitle: string;
  students: StudentInfo[];
  courseName: string;
  allSignatures: Array<{
    role: ApprovalRole;
    status: ApprovalStatus;
    approverName?: string;
    approvedAt?: Date;
    justification?: string;
  }>;
}

export interface ApprovalItem {
  id: string;
  role: ApprovalRole;
  status: ApprovalStatus;
  approverName?: string;
  approvedAt?: Date;
  justification?: string;
  approverId?: string;
}

export interface GroupedDocumentApprovals {
  documentId: string;
  documentTitle: string;
  students: StudentInfo[];
  courseName: string;
  createdAt: Date;
  approvals: ApprovalItem[];
}

export interface IApprovalRepository {
  create(approval: Approval): Promise<Approval>;
  update(approval: Approval): Promise<Approval>;
  findById(id: string): Promise<Approval | null>;
  findByDocumentId(documentId: string): Promise<Approval[]>;
  findPendingByDocumentId(documentId: string): Promise<Approval[]>;
  findAllPending(): Promise<Approval[]>;
  findAllPendingWithDetails(): Promise<ApprovalWithDetails[]>;
  findPendingByUserId(userId: string): Promise<Approval[]>;
  findPendingByUserIdWithDetails(userId: string): Promise<ApprovalWithDetails[]>;
  findAllByStatusWithDetails(status: ApprovalStatus): Promise<ApprovalWithDetails[]>;
  findByUserIdAndStatusWithDetails(userId: string, status: ApprovalStatus): Promise<ApprovalWithDetails[]>;
  findGroupedByStatus(status: ApprovalStatus): Promise<GroupedDocumentApprovals[]>;
  findGroupedByUserIdAndStatus(userId: string, status: ApprovalStatus): Promise<GroupedDocumentApprovals[]>;
  findAllGrouped(): Promise<GroupedDocumentApprovals[]>;
  findGroupedByUserId(userId: string): Promise<GroupedDocumentApprovals[]>;
  findGroupedByCourseId(courseId: string): Promise<GroupedDocumentApprovals[]>;
  findGroupedByCourseIdAndStatus(courseId: string, status: ApprovalStatus): Promise<GroupedDocumentApprovals[]>;
  findGroupedByParticipant(userId: string): Promise<GroupedDocumentApprovals[]>;
  delete(id: string): Promise<void>;
}
