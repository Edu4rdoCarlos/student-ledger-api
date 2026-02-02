import { Document, DocumentStatus } from '../../domain/entities';

export interface DocumentFilters {
  status?: DocumentStatus;

  defenseId?: string;
}

export interface DocumentSummary {
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  totalStudents: number;
}

export interface IDocumentRepository {
  create(document: Document): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findByCid(cid: string): Promise<Document | null>;
  findByDefenseId(defenseId: string): Promise<Document[]>;
  findAll(filters?: DocumentFilters): Promise<Document[]>;
  update(document: Document): Promise<Document>;
  delete(id: string): Promise<void>;
  existsByHash(hash: string): Promise<boolean>;
  getSummary(): Promise<DocumentSummary>;
}

export const DOCUMENT_REPOSITORY = Symbol('IDocumentRepository');
