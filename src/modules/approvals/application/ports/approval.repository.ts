import { Approval } from '../../domain/entities';

export const APPROVAL_REPOSITORY = Symbol('APPROVAL_REPOSITORY');

export interface IApprovalRepository {
  create(approval: Approval): Promise<Approval>;
  update(approval: Approval): Promise<Approval>;
  findById(id: string): Promise<Approval | null>;
  findByDocumentId(documentId: string): Promise<Approval[]>;
  findByDocumentIdAndRole(documentId: string, role: string): Promise<Approval | null>;
  findPendingByDocumentId(documentId: string): Promise<Approval[]>;
  findAllPending(): Promise<Approval[]>;
  findPendingByUserId(userId: string): Promise<Approval[]>;
  delete(id: string): Promise<void>;
}
