import { Approval, ApprovalRole, ApprovalStatus } from '../../domain/entities';

export const APPROVAL_REPOSITORY = Symbol('APPROVAL_REPOSITORY');

export interface StudentInfo {
  name: string;
  email: string;
  registration: string;
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
  findGroupedByCourseId(courseId: string): Promise<GroupedDocumentApprovals[]>;
  findGroupedByParticipant(userId: string): Promise<GroupedDocumentApprovals[]>;
  delete(id: string): Promise<void>;
}
