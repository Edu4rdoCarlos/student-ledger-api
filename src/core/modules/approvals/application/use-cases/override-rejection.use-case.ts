import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalRole, ApprovalStatus } from '../../domain/entities';
import { ApprovalNotFoundError } from '../../domain/errors';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { Document, DocumentType, DocumentTypeLabel } from '../../../documents/domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { Defense } from '../../../defenses/domain/entities';
import { IUserRepository, USER_REPOSITORY, User } from '../../../auth/application/ports';
import { SendEmailUseCase } from '../../../../toolkit/notifications/application/use-cases';
import { EmailTemplate, NotificationContextType } from '../../../../toolkit/notifications/domain/enums';

interface OverrideRejectionRequest {
  approvalId: string;
  userId: string;
  userRole: string;
  reason: string;
}

interface OverrideRejectionResponse {
  approval: Approval;
}

interface LoadedEntities {
  approver: User;
  document: Document;
  defense: Defense;
}

@Injectable()
export class OverrideRejectionUseCase {
  private readonly logger = new Logger(OverrideRejectionUseCase.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
  ) {}

  async execute(request: OverrideRejectionRequest): Promise<OverrideRejectionResponse> {
    this.validateUserRole(request.userRole);

    const approval = await this.findAndValidateApproval(request.approvalId);

    approval.resetToPending();
    const updatedApproval = await this.approvalRepository.update(approval);

    this.sendNotificationAsync(updatedApproval, request.reason);

    return { approval: updatedApproval };
  }

  private validateUserRole(userRole: string): void {
    if (userRole !== Role.COORDINATOR) {
      throw new ForbiddenException('Apenas coordenadores podem desconsiderar rejeições.');
    }
  }

  private async findAndValidateApproval(approvalId: string): Promise<Approval> {
    const approval = await this.approvalRepository.findById(approvalId);

    if (!approval) {
      throw new ApprovalNotFoundError();
    }

    if (approval.status !== ApprovalStatus.REJECTED) {
      throw new ForbiddenException('Apenas aprovações rejeitadas podem ser desconsideradas.');
    }

    if (approval.role === ApprovalRole.COORDINATOR) {
      throw new ForbiddenException('Coordenadores não podem desconsiderar suas próprias rejeições.');
    }

    return approval;
  }


  private sendNotificationAsync(approval: Approval, reason: string): void {
    this.sendOverrideNotificationEmail(approval, reason).catch(error => {
      this.logger.error(`Failed to send override notification email: ${error.message}`);
    });
  }

  private async sendOverrideNotificationEmail(approval: Approval, coordinatorReason: string): Promise<void> {
    const entities = await this.loadEntitiesForNotification(approval);
    if (!entities) return;

    const { approver, document, defense } = entities;

    await this.sendEmailUseCase.execute({
      userId: approver.id,
      to: approver.email,
      subject: `Rejeição desconsiderada - ${DocumentTypeLabel[DocumentType.MINUTES]}`,
      template: {
        id: EmailTemplate.REJECTION_OVERRIDDEN,
        data: {
          approverName: approver.name,
          approvalId: approval.id,
          documentType: DocumentTypeLabel[DocumentType.MINUTES],
          defenseTitle: defense.title,
          studentsNames: this.getStudentsNames(defense),
          coordinatorReason,
        },
      },
      contextType: NotificationContextType.DOCUMENT_APPROVAL,
      contextId: document.id,
    });
  }

  private async loadEntitiesForNotification(approval: Approval): Promise<LoadedEntities | null> {
    const approver = await this.userRepository.findById(approval.approverId!);
    if (!approver) {
      this.logger.warn(`Aprovador não encontrado: ${approval.approverId}`);
      return null;
    }

    const document = await this.documentRepository.findById(approval.documentId);
    if (!document) {
      this.logger.warn(`Documento não encontrado: ${approval.documentId}`);
      return null;
    }

    const defense = await this.defenseRepository.findById(document.defenseId);
    if (!defense) {
      this.logger.warn(`Defesa não encontrada: ${document.defenseId}`);
      return null;
    }

    return { approver, document, defense };
  }

  private getStudentsNames(defense: Defense): string {
    if (!defense.students || defense.students.length === 0) {
      return 'N/A';
    }
    return defense.students.map(student => student.name).join(', ');
  }
}
