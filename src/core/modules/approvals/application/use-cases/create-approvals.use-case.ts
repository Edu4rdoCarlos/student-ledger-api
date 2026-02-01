import { Injectable, Inject, Logger } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalRole } from '../../domain/entities';
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
import { Coordinator } from '../../../coordinators/domain/entities';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { Document, DocumentType, DocumentTypeLabel } from '../../../documents/domain/entities';
import { CertificateQueueService } from '../../../../toolkit/fabric/application/services/certificate-queue.service';
import { Role } from '@prisma/client';

interface CreateApprovalsRequest {
  documentId: string;
  coordinatorId: string;
}

interface CreateApprovalsResponse {
  approvals: Approval[];
}

interface LoadedEntities {
  document: Document;
  defense: Defense;
  advisor: Advisor;
  students: Student[];
  coordinator: Coordinator;
}

@Injectable()
export class CreateApprovalsUseCase {
  private readonly logger = new Logger(CreateApprovalsUseCase.name);

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
    private readonly certificateQueue: CertificateQueueService,
  ) {}

  async execute(request: CreateApprovalsRequest): Promise<CreateApprovalsResponse> {
    const entities = await this.loadRequiredEntities(request.documentId, request.coordinatorId);
    const isCoordinatorAlsoAdvisor = entities.coordinator.id === entities.advisor.id;

    const approvals = await this.createAllApprovals(request.documentId, entities, isCoordinatorAlsoAdvisor);

    return { approvals };
  }

  private async loadRequiredEntities(documentId: string, coordinatorId: string): Promise<LoadedEntities> {
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
    if (students.length === 0) {
      throw new Error('Nenhum aluno encontrado para a defesa');
    }

    const coordinator = await this.coordinatorRepository.findById(coordinatorId);
    if (!coordinator) {
      throw new Error('Coordenador não encontrado');
    }

    return { document, defense, advisor, students, coordinator };
  }

  private async loadStudents(studentIds: string[]): Promise<Student[]> {
    const students = await Promise.all(
      studentIds.map(id => this.studentRepository.findById(id))
    );
    return students.filter((s): s is Student => s !== null);
  }

  private async createAllApprovals(
    documentId: string,
    entities: LoadedEntities,
    isCoordinatorAlsoAdvisor: boolean,
  ): Promise<Approval[]> {
    const { document, defense, advisor, students, coordinator } = entities;
    const approvals: Approval[] = [];

    const coordinatorApproval = await this.createCoordinatorApproval(documentId, coordinator);
    approvals.push(coordinatorApproval);
    this.notifyApprover(coordinatorApproval, document, defense, advisor, students, coordinator);

    const advisorApproval = await this.createAdvisorApproval(documentId, advisor);
    approvals.push(advisorApproval);
    if (!isCoordinatorAlsoAdvisor) {
      this.notifyApprover(advisorApproval, document, defense, advisor, students, coordinator);
    }

    const studentApprovals = await this.createStudentApprovals(documentId, students, document, defense, advisor, coordinator);
    approvals.push(...studentApprovals);

    return approvals;
  }

  private async createCoordinatorApproval(documentId: string, coordinator: Coordinator): Promise<Approval> {
    const approval = Approval.create({
      role: ApprovalRole.COORDINATOR,
      documentId,
      approverId: coordinator.id,
    });
    return this.approvalRepository.create(approval);
  }

  private async createAdvisorApproval(documentId: string, advisor: Advisor): Promise<Approval> {
    const approval = Approval.create({
      role: ApprovalRole.ADVISOR,
      documentId,
      approverId: advisor.id,
    });
    const created = await this.approvalRepository.create(approval);

    this.enqueueCertificate(advisor.id, advisor.email, Role.ADVISOR, created.id!);

    return created;
  }

  private async createStudentApprovals(
    documentId: string,
    students: Student[],
    document: Document,
    defense: Defense,
    advisor: Advisor,
    coordinator: Coordinator,
  ): Promise<Approval[]> {
    const approvals: Approval[] = [];

    for (const student of students) {
      const approval = Approval.create({
        role: ApprovalRole.STUDENT,
        documentId,
        approverId: student.id,
      });
      const created = await this.approvalRepository.create(approval);
      approvals.push(created);

      this.enqueueCertificate(student.id, student.email, Role.STUDENT, created.id!);
      this.notifyApprover(created, document, defense, advisor, [student], coordinator);
    }

    return approvals;
  }

  private enqueueCertificate(userId: string, email: string, role: Role, approvalId: string): void {
    this.certificateQueue
      .enqueueCertificateGeneration(userId, email, role, approvalId)
      .catch(error => this.logger.error(`Falha ao enfileirar certificado: ${error.message}`));
  }

  private notifyApprover(
    approval: Approval,
    document: Document,
    defense: Defense,
    advisor: Advisor,
    students: Student[],
    coordinator: Coordinator,
  ): void {
    const recipient = this.resolveRecipient(approval, advisor, students, coordinator);
    if (!recipient) return;

    this.sendApprovalEmail(recipient, document, defense, students).catch(error => {
      this.logger.error(`Falha ao enviar email de aprovação: ${error.message}`);
    });
  }

  private resolveRecipient(
    approval: Approval,
    advisor: Advisor,
    students: Student[],
    coordinator: Coordinator,
  ): { id: string; email: string } | null {
    switch (approval.role) {
      case ApprovalRole.COORDINATOR:
        return { id: coordinator.id, email: coordinator.email };

      case ApprovalRole.ADVISOR:
        return { id: advisor.id, email: advisor.email };

      case ApprovalRole.STUDENT:
        const student = students.find(s => s.id === approval.approverId);
        if (!student) {
          this.logger.warn('Aluno não encontrado para envio de email');
          return null;
        }
        return { id: student.id, email: student.email };

      default:
        this.logger.warn(`Tipo de aprovação não reconhecido: ${approval.role}`);
        return null;
    }
  }

  private async sendApprovalEmail(
    recipient: { id: string; email: string },
    document: Document,
    defense: Defense,
    students: Student[],
  ): Promise<void> {
    const emailContent = this.emailTemplateRenderer.generateTemplate(
      EmailTemplate.DOCUMENT_APPROVAL_REQUEST,
      {
        documentType: DocumentTypeLabel[DocumentType.MINUTES],
        defenseTitle: defense.title,
        studentsNames: this.getStudentsNames(students),
        submittedAt: document.createdAt,
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
  }

  private getStudentsNames(students: Student[]): string {
    return students.map(s => s.name).filter(Boolean).join(', ');
  }
}
