import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalRole, ApprovalStatus } from '../../domain/entities';
import { ApprovalNotFoundError } from '../../domain/errors';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { SendEmailUseCase } from '../../../../toolkit/notifications/application/use-cases';
import { EmailTemplate } from '../../../../toolkit/notifications/domain/enums';
import { NotificationContextType } from '../../../../toolkit/notifications/domain/enums/context-type.enum';
import { Role } from '@prisma/client';

interface OverrideRejectionRequest {
  approvalId: string;
  userId: string;
  userRole: string;
  reason: string;
}

interface OverrideRejectionResponse {
  approval: Approval;
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
    if (request.userRole !== Role.COORDINATOR) {
      throw new ForbiddenException('Apenas coordenadores podem desconsiderar rejeições.');
    }

    const approval = await this.approvalRepository.findById(request.approvalId);

    if (!approval) {
      throw new ApprovalNotFoundError();
    }

    if (approval.status !== ApprovalStatus.REJECTED) {
      throw new ForbiddenException('Apenas aprovações rejeitadas podem ser desconsideradas.');
    }

    if (approval.role === ApprovalRole.COORDINATOR) {
      throw new ForbiddenException('Coordenadores não podem desconsiderar suas próprias rejeições.');
    }

    this.logger.log(
      `Coordinator ${request.userId} is overriding rejection for approval ${request.approvalId}. Reason: ${request.reason}`
    );

    approval.resetToPending();

    const updatedApproval = await this.approvalRepository.update(approval);

    this.sendOverrideNotificationEmail(updatedApproval, request.reason).catch((error) => {
      this.logger.error(`Failed to send override notification email: ${error.message}`);
    });

    return { approval: updatedApproval };
  }

  private async sendOverrideNotificationEmail(approval: Approval, coordinatorReason: string): Promise<void> {
    try {
      const approver = await this.userRepository.findById(approval.approverId!);
      if (!approver) {
        this.logger.warn(`Aprovador não encontrado: ${approval.approverId}`);
        return;
      }

      const document = await this.documentRepository.findById(approval.documentId);
      if (!document) {
        this.logger.warn(`Documento não encontrado: ${approval.documentId}`);
        return;
      }

      const defense = await this.defenseRepository.findById(document.defenseId);
      if (!defense) {
        this.logger.warn(`Defesa não encontrada: ${document.defenseId}`);
        return;
      }

      const studentsNames = defense.students && defense.students.length > 0
        ? defense.students.map((student) => student.name).join(', ')
        : 'N/A';

      await this.sendEmailUseCase.execute({
        userId: approver.id,
        to: approver.email,
        subject: `Rejeição desconsiderada - ATA de Defesa`,
        template: {
          id: EmailTemplate.REJECTION_OVERRIDDEN,
          data: {
            approverName: approver.name,
            approvalId: approval.id,
            documentType: 'ATA de Defesa',
            defenseTitle: defense.title,
            studentsNames,
            coordinatorReason,
          },
        },
        contextType: NotificationContextType.DOCUMENT_APPROVAL,
        contextId: document.id,
      });
    } catch (error) {
      this.logger.error(`Falha ao enviar email de notificação de override: ${error.message}`, error.stack);
    }
  }
}
