import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import {
  IFabricGateway,
  FABRIC_GATEWAY,
  FabricUser,
  FabricHealthStatus,
  DocumentRecord,
  DocumentSignature,
  VerifyDocumentResult,
  OrgName,
  UserRole,
  DefenseResult,
} from './application/ports';

@Injectable()
export class FabricService implements OnModuleInit {
  constructor(
    @Inject(FABRIC_GATEWAY)
    private readonly fabricGateway: IFabricGateway,
  ) {}

  async onModuleInit() {
    await this.healthCheck();
  }

  async healthCheck(): Promise<FabricHealthStatus> {
    return this.fabricGateway.healthCheck();
  }

  getOrgForRole(role: UserRole): OrgName {
    return this.fabricGateway.getOrgForRole(role);
  }

  getMspIdForRole(role: 'coordenador' | 'orientador' | 'aluno'): string {
    return this.fabricGateway.getMspIdForRole(role);
  }

  async registerDocument(
    user: FabricUser,
    documentHash: string,
    ipfsCid: string,
    matriculas: string[],
    defenseDate: string,
    notaFinal: number,
    resultado: DefenseResult,
    motivo: string,
    signatures: DocumentSignature[],
    validatedAt: string,
  ): Promise<DocumentRecord> {
    return this.fabricGateway.registerDocument(
      user,
      documentHash,
      ipfsCid,
      matriculas,
      defenseDate,
      notaFinal,
      resultado,
      motivo,
      signatures,
      validatedAt,
    );
  }

  async verifyDocument(user: FabricUser, ipfsCid: string): Promise<VerifyDocumentResult> {
    return this.fabricGateway.verifyDocument(user, ipfsCid);
  }

  async getLatestDocument(user: FabricUser, matricula: string): Promise<DocumentRecord> {
    return this.fabricGateway.getLatestDocument(user, matricula);
  }

  async getDocument(user: FabricUser, matricula: string, versao: number): Promise<DocumentRecord> {
    return this.fabricGateway.getDocument(user, matricula, versao);
  }

  async getDocumentHistory(user: FabricUser, matricula: string): Promise<DocumentRecord[]> {
    return this.fabricGateway.getDocumentHistory(user, matricula);
  }

  async getDocumentModificationHistory(
    user: FabricUser,
    matricula: string,
    versao: number,
  ): Promise<any[]> {
    return this.fabricGateway.getDocumentModificationHistory(user, matricula, versao);
  }

  async getApprovedDocument(user: FabricUser, matricula: string): Promise<DocumentRecord> {
    return this.fabricGateway.getApprovedDocument(user, matricula);
  }

  async documentExists(user: FabricUser, matricula: string): Promise<boolean> {
    return this.fabricGateway.documentExists(user, matricula);
  }

  async getVersionCount(user: FabricUser, matricula: string): Promise<number> {
    return this.fabricGateway.getVersionCount(user, matricula);
  }
}
