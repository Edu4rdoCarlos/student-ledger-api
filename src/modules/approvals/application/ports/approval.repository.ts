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
  delete(id: string): Promise<void>;
}
