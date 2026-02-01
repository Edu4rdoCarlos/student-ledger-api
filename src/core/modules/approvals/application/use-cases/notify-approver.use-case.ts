import { Injectable, Inject, Logger } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalRole } from '../../domain/entities';
import { ApprovalNotFoundError } from '../../domain/errors';
import { SendEmailUseCase } from '../../../../toolkit/notifications/application/use-cases';
import { EmailTemplateRenderer } from '../../../../toolkit/notifications/infra/templates';
import { EmailTemplate, NotificationContextType } from '../../../../toolkit/notifications/domain/enums';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { Defense } from '../../../defenses/domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { Student } from '../../../students/domain/entities';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { Advisor } from '../../../advisors/domain/entities';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { Document, DocumentType, DocumentTypeLabel } from '../../../documents/domain/entities';

export interface NotifyApproverRequest {
  approvalId: string;
}

export interface NotifyApproverResponse {
  success: boolean;
}

interface LoadedEntities {
  document: Document;
  defense: Defense;
  advisor: Advisor;
  students: Student[];
}

@Injectable()
export class NotifyApproverUseCase {
  private readonly logger = new Logger(NotifyApproverUseCase.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly emailTemplateRenderer: EmailTemplateRenderer,
  ) {}

  async execute(request: NotifyApproverRequest): Promise<NotifyApproverResponse> {
    const approval = await this.findApproval(request.approvalId);
    const entities = await this.loadRequiredEntities(approval.documentId);
    const recipient = await this.resolveRecipient(approval, entities);

    await this.sendNotificationEmail(recipient, approval, entities);

    return { success: true };
  }

  private async findApproval(approvalId: string): Promise<Approval> {
    const approval = await this.approvalRepository.findById(approvalId);
    if (!approval) {
      throw new ApprovalNotFoundError();
    }
    return approval;
  }

  private async loadRequiredEntities(documentId: string): Promise<LoadedEntities> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Documento não encontrado');
    }

    const defense = await this.defenseRepository.findById(document.defenseId);
    if (!defense) {
      throw new Error('Defesa não encontrada');
    }

    const advisor = await this.advisorRepository.findById(defense.advisorId);
    if (!advisor) {
      throw new Error('Orientador não encontrado');
    }

    const students = await this.loadStudents(defense.studentIds);

    return { document, defense, advisor, students };
  }

  private async loadStudents(studentIds: string[]): Promise<Student[]> {
    const students = await Promise.all(
      studentIds.map(id => this.studentRepository.findById(id))
    );
    return students.filter((s): s is Student => s !== null);
  }

  private async resolveRecipient(
    approval: Approval,
    entities: LoadedEntities,
  ): Promise<{ id: string; email: string }> {
    const { advisor, students } = entities;

    switch (approval.role) {
      case ApprovalRole.COORDINATOR:
        return this.resolveCoordinatorRecipient(approval.approverId);

      case ApprovalRole.ADVISOR:
        return { id: advisor.id, email: advisor.email };

      case ApprovalRole.STUDENT:
        return this.resolveStudentRecipient(approval.approverId, students);

      default:
        throw new Error(`Tipo de aprovação não reconhecido: ${approval.role}`);
    }
  }

  private async resolveCoordinatorRecipient(approverId?: string): Promise<{ id: string; email: string }> {
    if (!approverId) {
      throw new Error('Aprovador do coordenador não definido');
    }

    const coordinator = await this.coordinatorRepository.findById(approverId);
    if (!coordinator) {
      throw new Error('Coordenador não encontrado');
    }

    return { id: coordinator.id, email: coordinator.email };
  }

  private resolveStudentRecipient(
    approverId: string | undefined,
    students: Student[],
  ): { id: string; email: string } {
    if (!approverId) {
      throw new Error('Aprovador do aluno não definido');
    }

    const student = students.find(s => s.id === approverId);
    if (!student) {
      throw new Error('Aluno não encontrado');
    }

    return { id: student.id, email: student.email };
  }

  private async sendNotificationEmail(
    recipient: { id: string; email: string },
    approval: Approval,
    entities: LoadedEntities,
  ): Promise<void> {
    const { document, defense, students } = entities;

    const emailContent = this.emailTemplateRenderer.generateTemplate(
      EmailTemplate.DOCUMENT_APPROVAL_REQUEST,
      {
        documentType: DocumentTypeLabel[DocumentType.MINUTES],
        defenseTitle: defense.title,
        studentsNames: this.getStudentsNames(students),
        submittedAt: document.createdAt,
        approvalId: approval.id,
        documentId: document.id,
      },
    );

    await this.sendEmailUseCase.execute({
      userId: recipient.id,
      to: recipient.email,
      subject: emailContent.subject,
      html: emailContent.html,
      contextType: NotificationContextType.DOCUMENT_APPROVAL,
      contextId: document.id,
    });

    this.logger.log(`Notificação enviada para ${recipient.email} (approval: ${approval.id})`);
  }

  private getStudentsNames(students: Student[]): string {
    return students.map(s => s.name).filter(Boolean).join(', ');
  }
}
