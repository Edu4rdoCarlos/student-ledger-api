import { Injectable, Inject, Logger } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { IFabricGateway, FABRIC_GATEWAY, DocumentSignature } from '../../../fabric/application/ports';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { ApprovalStatus, ApprovalRole } from '../../domain/entities';

interface RegisterOnBlockchainRequest {
  documentId: string;
}

interface RegisterOnBlockchainResponse {
  registered: boolean;
  blockchainTxId?: string;
}

@Injectable()
export class RegisterOnBlockchainUseCase {
  private readonly logger = new Logger(RegisterOnBlockchainUseCase.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(FABRIC_GATEWAY)
    private readonly fabricGateway: IFabricGateway,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: RegisterOnBlockchainRequest): Promise<RegisterOnBlockchainResponse> {
    const approvals = await this.approvalRepository.findByDocumentId(request.documentId);

    const allApproved = approvals.every(approval => approval.status === ApprovalStatus.APPROVED);
    const anyRejected = approvals.some(approval => approval.status === ApprovalStatus.REJECTED);

    if (anyRejected) {
      this.logger.warn(`Document ${request.documentId} has rejections, skipping blockchain registration`);
      return { registered: false };
    }

    if (!allApproved) {
      this.logger.log(`Document ${request.documentId} does not have all approvals yet`);
      return { registered: false };
    }

    const document = await this.documentRepository.findById(request.documentId);
    if (!document) {
      throw new Error('Documento não encontrado');
    }

    if (document.blockchainTxId) {
      this.logger.warn(`Document ${request.documentId} already registered on blockchain`);
      return { registered: true, blockchainTxId: document.blockchainTxId };
    }

    const defense = await this.defenseRepository.findById(document.defenseId);
    if (!defense) {
      throw new Error('Defesa não encontrada');
    }

    if (!document.documentHash) {
      this.logger.error(`Document ${request.documentId} does not have IPFS hash`);
      throw new Error('Documento não possui hash IPFS');
    }

    const userIds = approvals
      .map(approval => approval.approverId)
      .filter((id): id is string => id !== undefined);

    const users = await this.userRepository.findByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, u]));

    const roleToFabricRole = (role: ApprovalRole): 'coordenador' | 'orientador' | 'aluno' => {
      switch (role) {
        case ApprovalRole.COORDINATOR:
          return 'coordenador';
        case ApprovalRole.ADVISOR:
          return 'orientador';
        case ApprovalRole.STUDENT:
          return 'aluno';
        default:
          return 'coordenador';
      }
    };

    const signatures: DocumentSignature[] = approvals.map(approval => {
      const user = approval.approverId ? userMap.get(approval.approverId) : null;
      const fabricRole = roleToFabricRole(approval.role);

      return {
        role: fabricRole,
        email: user?.email || 'system@ifal.local',
        mspId: fabricRole === 'coordenador' ? 'CoordenacaoMSP' :
               fabricRole === 'orientador' ? 'OrientadorMSP' : 'AlunoMSP',
        timestamp: approval.approvedAt?.toISOString() || new Date().toISOString(),
      };
    });

    try {
      const fabricUser = {
        id: 'system',
        email: 'system@ifal.local',
        role: 'ADMIN' as any,
      };

      const result = await this.fabricGateway.registerDocument(
        fabricUser,
        document.documentHash,
        defense.studentIds[0] || 'UNKNOWN',
        defense.defenseDate.toISOString(),
        defense.finalGrade || 0,
        defense.result as any,
        '',
        signatures,
        new Date().toISOString(),
      );

      document.registerOnBlockchain(result.documentId);
      document.approve();

      await this.documentRepository.update(document);

      this.logger.log(`Document ${request.documentId} registered on blockchain successfully`);

      return {
        registered: true,
        blockchainTxId: result.documentId,
      };
    } catch (error) {
      this.logger.error(`Failed to register document on blockchain: ${error.message}`, error.stack);
      throw new Error(`Falha ao registrar documento no blockchain: ${error.message}`);
    }
  }
}
