export type OrgName = 'coordenacao' | 'orientador' | 'aluno';

export type UserRole = 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';

export type DefenseResult = 'APPROVED' | 'FAILED';

export interface FabricUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface DocumentSignature {
  role: 'coordenador' | 'orientador' | 'aluno' | 'coordenador_orientador';
  email: string;
  mspId: string;
  signature: string; // Base64 encoded cryptographic signature
  timestamp: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  justification?: string;
}

export interface DocumentRecord {
  documentId: string;
  // Ata (Minutes) document
  minutesHash: string;
  minutesCid: string;
  // Avaliação de Desempenho (Evaluation) document
  evaluationHash: string;
  evaluationCid: string;
  matriculas: string[];
  defenseDate: string;
  notaFinal: number;
  resultado: DefenseResult;
  versao: number;
  motivo: string;
  registeredBy: string;
  status: 'APPROVED';
  signatures: DocumentSignature[];
  validatedAt: string;
}

export interface VerifyDocumentResult {
  valid: boolean;
  reason: string;
  documentType: 'minutes' | 'evaluation' | null;
  document: DocumentRecord | null;
}

export interface FabricHealthStatus {
  status: 'ok' | 'error';
  message: string;
}

export interface IFabricGateway {
  healthCheck(): Promise<FabricHealthStatus>;
  getOrgForRole(role: UserRole): OrgName;
  getMspIdForRole(role: 'coordenador' | 'orientador' | 'aluno'): string;

  registerDocument(
    user: FabricUser,
    minutesHash: string,
    minutesCid: string,
    evaluationHash: string,
    evaluationCid: string,
    matriculas: string[],
    defenseDate: string,
    notaFinal: number,
    resultado: DefenseResult,
    motivo: string,
    signatures: DocumentSignature[],
    validatedAt: string,
  ): Promise<DocumentRecord>;

  verifyDocument(user: FabricUser, ipfsCid: string): Promise<VerifyDocumentResult>;
  getLatestDocument(user: FabricUser, matricula: string): Promise<DocumentRecord>;
  getDocument(user: FabricUser, matricula: string, versao: number): Promise<DocumentRecord>;
  getDocumentHistory(user: FabricUser, matricula: string): Promise<DocumentRecord[]>;
  getDocumentModificationHistory(user: FabricUser, matricula: string, versao: number): Promise<any[]>;
  getApprovedDocument(user: FabricUser, matricula: string): Promise<DocumentRecord>;
  documentExists(user: FabricUser, matricula: string): Promise<boolean>;
  getVersionCount(user: FabricUser, matricula: string): Promise<number>;
}

export const FABRIC_GATEWAY = Symbol('IFabricGateway');
