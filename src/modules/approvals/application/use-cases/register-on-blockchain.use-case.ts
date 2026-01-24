import { Injectable, Inject, Logger } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { IFabricGateway, FABRIC_GATEWAY, DocumentSignature } from '../../../fabric/application/ports';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { ApprovalStatus, ApprovalRole } from '../../domain/entities';
import { FabricOrganizationConfig } from '../../../fabric/infra/config/fabric-organization.config';
import { Role } from '@prisma/client';

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
    private readonly fabricOrgConfig: FabricOrganizationConfig,
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

    const expectedApprovals = 2 + defense.studentIds.length;
    if (approvals.length !== expectedApprovals) {
      this.logger.error(
        `Documento ${request.documentId} possui ${approvals.length} aprovações, mas esperava ${expectedApprovals} ` +
        `(coordenador + orientador + ${defense.studentIds.length} aluno(s))`
      );
      throw new Error(
        `Número inválido de aprovações: ${approvals.length}. Esperado: ${expectedApprovals}`
      );
    }

    if (!document.minutesHash) {
      this.logger.error(`Documento ${request.documentId} não possui hash SHA-256 da Ata`);
      throw new Error('Documento não possui hash SHA-256 da Ata');
    }

    if (!document.minutesCid) {
      this.logger.error(`Documento ${request.documentId} não possui CID do IPFS da Ata`);
      throw new Error('Documento não possui CID do IPFS da Ata');
    }

    if (!document.evaluationHash) {
      this.logger.error(`Documento ${request.documentId} não possui hash SHA-256 da Avaliação`);
      throw new Error('Documento não possui hash SHA-256 da Avaliação de Desempenho');
    }

    if (!document.evaluationCid) {
      this.logger.error(`Documento ${request.documentId} não possui CID do IPFS da Avaliação`);
      throw new Error('Documento não possui CID do IPFS da Avaliação de Desempenho');
    }

    const userIds = approvals
      .map(approval => approval.approverId)
      .filter((id): id is string => id !== undefined);

    const users = await this.userRepository.findByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, u]));

    const coordinatorApproval = approvals.find(a => a.role === ApprovalRole.COORDINATOR);
    const advisorApproval = approvals.find(a => a.role === ApprovalRole.ADVISOR);
    const isCoordinatorAlsoAdvisor =
      coordinatorApproval?.approverId === advisorApproval?.approverId;

    const signatures: DocumentSignature[] = approvals
      .filter(approval => !(isCoordinatorAlsoAdvisor && approval.role === ApprovalRole.ADVISOR))
      .map(approval => {
        if (!approval.approverId) {
          throw new Error(`Aprovação ${approval.id} não possui aprovador identificado`);
        }

        const user = userMap.get(approval.approverId);
        if (!user) {
          throw new Error(`Usuário aprovador não encontrado: ${approval.approverId}`);
        }

        if (!approval.approvedAt) {
          throw new Error(`Aprovação ${approval.id} não possui data de aprovação`);
        }

        if (!approval.cryptographicSignature) {
          throw new Error(`Aprovação ${approval.id} não possui assinatura criptográfica`);
        }

        const isHybridRole = isCoordinatorAlsoAdvisor && approval.role === ApprovalRole.COORDINATOR;

        const fabricRole = isHybridRole ? 'coordenador_orientador' :
          approval.role === ApprovalRole.COORDINATOR ? 'coordenador' :
          approval.role === ApprovalRole.ADVISOR ? 'orientador' : 'aluno';

        const userRole: Role = approval.role === ApprovalRole.STUDENT ? 'STUDENT' : 'COORDINATOR';
        const mspId = this.fabricOrgConfig.getMspIdByRole(userRole);

        const documentSignature: DocumentSignature = {
          role: fabricRole,
          email: user.email,
          mspId,
          signature: approval.cryptographicSignature,
          timestamp: approval.approvedAt.toISOString(),
          status: approval.status as 'APPROVED' | 'REJECTED' | 'PENDING',
        };

        if (approval.justification) {
          documentSignature.justification = approval.justification;
        }

        return documentSignature;
      });

    try {
      const coordinatorApproval = approvals.find(
        approval => approval.role === ApprovalRole.COORDINATOR
      );

      if (!coordinatorApproval?.approverId) {
        this.logger.error(`Aprovação do coordenador não encontrada para documento ${request.documentId}`);
        throw new Error('Aprovação do coordenador não encontrada');
      }

      const coordinator = userMap.get(coordinatorApproval.approverId);
      if (!coordinator) {
        this.logger.error(`Coordenador não encontrado: ${coordinatorApproval.approverId}`);
        throw new Error('Coordenador não encontrado');
      }

      const fabricUser = {
        id: coordinator.id,
        email: coordinator.email,
        role: coordinator.role as 'COORDINATOR',
      };

      if (!defense.studentIds || defense.studentIds.length === 0) {
        this.logger.error(`Defesa ${defense.id} não possui alunos vinculados`);
        throw new Error('Defesa não possui alunos vinculados');
      }

      if (defense.finalGrade === null || defense.finalGrade === undefined) {
        this.logger.error(`Defesa ${defense.id} não possui nota final`);
        throw new Error('Defesa não possui nota final');
      }

      if (!defense.result) {
        this.logger.error(`Defesa ${defense.id} não possui resultado`);
        throw new Error('Defesa não possui resultado');
      }

      if (defense.result !== 'APPROVED' && defense.result !== 'FAILED') {
        this.logger.error(`Defesa ${defense.id} possui resultado inválido: ${defense.result}`);
        throw new Error(`Defesa possui resultado inválido para registro no blockchain: ${defense.result}`);
      }

      const result = await this.fabricGateway.registerDocument(
        fabricUser,
        document.minutesHash,
        document.minutesCid,
        document.evaluationHash,
        document.evaluationCid,
        defense.studentIds,
        defense.defenseDate.toISOString(),
        defense.finalGrade,
        defense.result,
        '',
        signatures,
        new Date().toISOString(),
      );

      document.registerOnBlockchain(result.documentId);
      document.approve();

      await this.documentRepository.update(document);

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
