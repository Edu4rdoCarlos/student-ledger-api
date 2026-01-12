import { Document, DocumentStatus } from '../../domain/entities';

export interface DocumentFilters {
  status?: DocumentStatus;
  
  defenseId?: string;
}

export interface IDocumentRepository {
  create(document: Document): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findByHash(hash: string): Promise<Document | null>;
  findByDefenseId(defenseId: string): Promise<Document[]>;
  findLatestVersion(defenseId: string): Promise<Document | null>;
  findAll(filters?: DocumentFilters): Promise<Document[]>;
  findHistory(documentId: string): Promise<Document[]>;
  update(document: Document): Promise<Document>;
  delete(id: string): Promise<void>;
  existsByHash(hash: string): Promise<boolean>;
}

export const DOCUMENT_REPOSITORY = Symbol('IDocumentRepository');
