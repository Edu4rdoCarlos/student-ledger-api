export type OrgName = 'coordenacao' | 'orientador' | 'aluno';

export type UserRole = 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';

export enum DefenseResult {
  APPROVED = 'APPROVED',
  FAILED = 'FAILED',
}

export interface FabricUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface DocumentSignature {
  role: 'coordenador' | 'orientador' | 'aluno' | 'coordenador_orientador';
  email: string;
  mspId: string;
  signature: string;
  timestamp: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  justification?: string;
}

export interface DocumentRecord {
  documentId: string;
  minutesHash: string;
  minutesCid: string;
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
}

export const FABRIC_GATEWAY = Symbol('IFabricGateway');
