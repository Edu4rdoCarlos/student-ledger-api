import { Injectable, Inject, Logger, ForbiddenException } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalRole } from '../../domain/entities';
import { ApprovalNotFoundError } from '../../domain/errors';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { SendEmailUseCase } from '../../../notifications/application/use-cases';
import { EmailTemplate } from '../../../notifications/domain/enums';
import { NotificationContextType } from '../../../notifications/domain/enums/context-type.enum';

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
    // Only coordinators can override rejections
    if (request.userRole !== 'COORDINATOR') {
      throw new ForbiddenException('Apenas coordenadores podem desconsiderar rejeições.');
    }

    const approval = await this.approvalRepository.findById(request.approvalId);

    if (!approval) {
      throw new ApprovalNotFoundError();
    }

    if (approval.status !== 'REJECTED') {
      throw new ForbiddenException('Apenas aprovações rejeitadas podem ser desconsideradas.');
    }

    // Coordinator cannot override their own rejection (they shouldn't reject anyway)
    if (approval.role === ApprovalRole.COORDINATOR) {
      throw new ForbiddenException('Coordenadores não podem desconsiderar suas próprias rejeições.');
    }

    // Log the override action
    this.logger.log(
      `Coordinator ${request.userId} is overriding rejection for approval ${request.approvalId}. Reason: ${request.reason}`
    );

    // Reset approval to PENDING state
    approval.resetToPending();

    const updatedApproval = await this.approvalRepository.update(approval);

    // Send email notification to the approver
    await this.sendOverrideNotificationEmail(updatedApproval, request.reason);

    return { approval: updatedApproval };
  }

  private async sendOverrideNotificationEmail(approval: Approval, coordinatorReason: string): Promise<void> {
    try {
      // Get approver information
      const approver = await this.userRepository.findById(approval.approverId!);
      if (!approver) {
        this.logger.warn(`Approver not found: ${approval.approverId}`);
        return;
      }

      // Get document information
      const document = await this.documentRepository.findById(approval.documentId);
      if (!document) {
        this.logger.warn(`Document not found: ${approval.documentId}`);
        return;
      }

      // Get defense information
      const defense = await this.defenseRepository.findById(document.defenseId);
      if (!defense) {
        this.logger.warn(`Defense not found: ${document.defenseId}`);
        return;
      }

      // Get students names
      const studentsNames = defense.students && defense.students.length > 0
        ? defense.students.map((student) => student.name).join(', ')
        : 'N/A';

      // Send email
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

      this.logger.log(`Override notification email sent to ${approver.email}`);
    } catch (error) {
      this.logger.error(`Failed to send override notification email: ${error.message}`, error.stack);
      // Don't throw - email failure shouldn't block the override operation
    }
  }
}
