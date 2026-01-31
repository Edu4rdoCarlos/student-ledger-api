import { Injectable, Inject, Logger } from '@nestjs/common';
import { Role, RevocationReason } from '@prisma/client';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalStatus, ApprovalRole } from '../../domain/entities';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { Document } from '../../../documents/domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { Defense } from '../../../defenses/domain/entities';
import { IFabricGateway, FABRIC_GATEWAY, DocumentSignature, DefenseResult as FabricDefenseResult } from '../../../../toolkit/fabric/application/ports';
import { IUserRepository, USER_REPOSITORY, User } from '../../../auth/application/ports';
import { FabricOrganizationConfig } from '../../../../toolkit/fabric/infra/config/fabric-organization.config';
import { CertificateManagementService } from '../../../../toolkit/fabric/application/services/certificate-management.service';

interface RegisterOnBlockchainRequest {
  documentId: string;
}

interface RegisterOnBlockchainResponse {
  registered: boolean;
  blockchainTxId?: string;
}

interface LoadedEntities {
  document: Document;
  defense: Defense;
  approvals: Approval[];
  users: Map<string, User>;
  coordinator: User;
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
    private readonly certificateManagement: CertificateManagementService,
  ) {}

  async execute(request: RegisterOnBlockchainRequest): Promise<RegisterOnBlockchainResponse> {
    const approvals = await this.approvalRepository.findByDocumentId(request.documentId);

    if (!this.areAllApprovalsComplete(approvals)) {
      return { registered: false };
    }

    const entities = await this.loadRequiredEntities(request.documentId, approvals);

    if (entities.document.blockchainTxId) {
      this.logger.warn(`Document ${request.documentId} already registered on blockchain`);
      return { registered: true, blockchainTxId: entities.document.blockchainTxId };
    }

    this.validateEntities(entities);

    const blockchainTxId = await this.registerOnFabric(entities);

    this.triggerPostRegistrationActions(entities);

    return { registered: true, blockchainTxId };
  }

  private areAllApprovalsComplete(approvals: Approval[]): boolean {
    const anyRejected = approvals.some(a => a.status === ApprovalStatus.REJECTED);
    if (anyRejected) {
      this.logger.warn('Document has rejections, skipping blockchain registration');
      return false;
    }

    return approvals.every(a => a.status === ApprovalStatus.APPROVED);
  }

  private async loadRequiredEntities(documentId: string, approvals: Approval[]): Promise<LoadedEntities> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Documento não encontrado');
    }

    const defense = await this.defenseRepository.findById(document.defenseId);
    if (!defense) {
      throw new Error('Defesa não encontrada');
    }

    const users = await this.loadUsers(approvals);
    const coordinator = this.findCoordinator(approvals, users);

    return { document, defense, approvals, users, coordinator };
  }

  private async loadUsers(approvals: Approval[]): Promise<Map<string, User>> {
    const userIds = approvals
      .map(a => a.approverId)
      .filter((id): id is string => id !== undefined);

    const users = await this.userRepository.findByIds(userIds);
    return new Map(users.map(u => [u.id, u]));
  }

  private findCoordinator(approvals: Approval[], users: Map<string, User>): User {
    const coordinatorApproval = approvals.find(a => a.role === ApprovalRole.COORDINATOR);
    if (!coordinatorApproval?.approverId) {
      throw new Error('Aprovação do coordenador não encontrada');
    }

    const coordinator = users.get(coordinatorApproval.approverId);
    if (!coordinator) {
      throw new Error('Coordenador não encontrado');
    }

    return coordinator;
  }

  private validateEntities(entities: LoadedEntities): void {
    this.validateApprovalsCount(entities.approvals, entities.defense);
    this.validateDocumentHashes(entities.document);
    this.validateDefense(entities.defense);
  }

  private validateApprovalsCount(approvals: Approval[], defense: Defense): void {
    const expected = 2 + defense.studentIds.length;
    if (approvals.length !== expected) {
      this.logger.error(
        `Documento possui ${approvals.length} aprovações, mas esperava ${expected} ` +
        `(coordenador + orientador + ${defense.studentIds.length} aluno(s))`
      );
      throw new Error(`Número inválido de aprovações: ${approvals.length}. Esperado: ${expected}`);
    }
  }

  private validateDocumentHashes(document: Document): void {
    if (!document.minutesHash) {
      throw new Error('Documento não possui hash SHA-256 da Ata');
    }
    if (!document.minutesCid) {
      throw new Error('Documento não possui CID do IPFS da Ata');
    }
    if (!document.evaluationHash) {
      throw new Error('Documento não possui hash SHA-256 da Avaliação de Desempenho');
    }
    if (!document.evaluationCid) {
      throw new Error('Documento não possui CID do IPFS da Avaliação de Desempenho');
    }
  }

  private validateDefense(defense: Defense): void {
    if (!defense.studentIds?.length) {
      throw new Error('Defesa não possui alunos vinculados');
    }
    if (defense.finalGrade === null || defense.finalGrade === undefined) {
      throw new Error('Defesa não possui nota final');
    }
    if (!defense.result) {
      throw new Error('Defesa não possui resultado');
    }
    if (defense.result !== 'APPROVED' && defense.result !== 'FAILED') {
      throw new Error(`Defesa possui resultado inválido para registro no blockchain: ${defense.result}`);
    }
  }

  private async registerOnFabric(entities: LoadedEntities): Promise<string> {
    const { document, defense, approvals, users, coordinator } = entities;
    const signatures = this.buildSignatures(approvals, users);

    const fabricUser = {
      id: coordinator.id,
      email: coordinator.email,
      role: coordinator.role as 'COORDINATOR',
    };

    try {
      const result = await this.fabricGateway.registerDocument(
        fabricUser,
        document.minutesHash!,
        document.minutesCid!,
        document.evaluationHash!,
        document.evaluationCid!,
        defense.studentIds,
        defense.defenseDate.toISOString(),
        defense.finalGrade!,
        defense.result as FabricDefenseResult,
        '',
        signatures,
        new Date().toISOString(),
      );

      document.registerOnBlockchain(result.documentId);
      document.approve();
      await this.documentRepository.update(document);

      return result.documentId;
    } catch (error) {
      this.logger.error(`Failed to register document on blockchain: ${error.message}`, error.stack);
      throw new Error(`Falha ao registrar documento no blockchain: ${error.message}`);
    }
  }

  private buildSignatures(approvals: Approval[], users: Map<string, User>): DocumentSignature[] {
    const signatures: DocumentSignature[] = [];
    const coordinatorApproval = approvals.find(a => a.role === ApprovalRole.COORDINATOR);
    const advisorApproval = approvals.find(a => a.role === ApprovalRole.ADVISOR);
    const isCoordinatorAlsoAdvisor = coordinatorApproval?.approverId === advisorApproval?.approverId;

    for (const approval of approvals) {
      this.validateApprovalForSignature(approval);

      const user = users.get(approval.approverId!);
      if (!user) {
        throw new Error(`Usuário aprovador não encontrado: ${approval.approverId}`);
      }

      if (isCoordinatorAlsoAdvisor && approval.role === ApprovalRole.ADVISOR) {
        continue;
      }

      const signature = this.createSignature(approval, user);
      signatures.push(signature);

      if (isCoordinatorAlsoAdvisor && approval.role === ApprovalRole.COORDINATOR) {
        const advisorSignature = this.createAdvisorSignatureFromCoordinator(
          approval,
          advisorApproval!,
          user,
        );
        signatures.push(advisorSignature);
      }
    }

    return signatures;
  }

  private validateApprovalForSignature(approval: Approval): void {
    if (!approval.approverId) {
      throw new Error(`Aprovação ${approval.id} não possui aprovador identificado`);
    }
    if (!approval.approvedAt) {
      throw new Error(`Aprovação ${approval.id} não possui data de aprovação`);
    }
    if (!approval.cryptographicSignature) {
      throw new Error(`Aprovação ${approval.id} não possui assinatura criptográfica`);
    }
  }

  private createSignature(approval: Approval, user: User): DocumentSignature {
    const fabricRole = this.getFabricRole(approval.role);
    const userRole = this.getUserRole(approval.role);
    const mspId = this.fabricOrgConfig.getMspIdByRole(userRole);

    const signature: DocumentSignature = {
      role: fabricRole,
      email: user.email,
      mspId,
      signature: approval.cryptographicSignature!,
      timestamp: approval.approvedAt!.toISOString(),
      status: approval.status,
    };

    if (approval.justification) {
      signature.justification = approval.justification;
    }

    return signature;
  }

  private createAdvisorSignatureFromCoordinator(
    coordinatorApproval: Approval,
    advisorApproval: Approval,
    user: User,
  ): DocumentSignature {
    return {
      role: 'orientador',
      email: user.email,
      mspId: this.fabricOrgConfig.getMspIdByRole('ADVISOR'),
      signature: advisorApproval.cryptographicSignature || coordinatorApproval.cryptographicSignature!,
      timestamp: advisorApproval.approvedAt?.toISOString() || coordinatorApproval.approvedAt!.toISOString(),
      status: advisorApproval.status || coordinatorApproval.status,
    };
  }

  private getFabricRole(role: ApprovalRole): 'coordenador' | 'orientador' | 'aluno' {
    switch (role) {
      case ApprovalRole.COORDINATOR:
        return 'coordenador';
      case ApprovalRole.ADVISOR:
        return 'orientador';
      default:
        return 'aluno';
    }
  }

  private getUserRole(role: ApprovalRole): Role {
    switch (role) {
      case ApprovalRole.STUDENT:
        return 'STUDENT';
      case ApprovalRole.ADVISOR:
        return 'ADVISOR';
      default:
        return 'COORDINATOR';
    }
  }

  private triggerPostRegistrationActions(entities: LoadedEntities): void {
    this.revokeNonCoordinatorCertificates(entities.approvals, entities.coordinator.id)
      .catch(error => this.logger.error(`Falha ao revogar certificados: ${error.message}`));
  }

  private async revokeNonCoordinatorCertificates(
    approvals: Approval[],
    coordinatorId: string,
  ): Promise<void> {
    const nonCoordinatorApprovals = approvals.filter(a => a.role !== ApprovalRole.COORDINATOR);

    for (const approval of nonCoordinatorApprovals) {
      if (!approval.id) continue;

      try {
        await this.certificateManagement.revokeCertificateByApprovalId(
          approval.id,
          RevocationReason.CESSATION_OF_OPERATION,
          coordinatorId,
        );
      } catch (error) {
        this.logger.warn(`Falha ao revogar certificado da approval ${approval.id}: ${error.message}`);
      }
    }
  }
}
