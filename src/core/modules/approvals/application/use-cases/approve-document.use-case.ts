import { Injectable, Inject, Logger, forwardRef, ForbiddenException } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalRole, ApprovalStatus } from '../../domain/entities';
import { ApprovalNotFoundError, ApprovalAlreadyProcessedError } from '../../domain/errors';
import { RegisterOnBlockchainUseCase } from './register-on-blockchain.use-case';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { Document, DocumentType, DocumentTypeLabel } from '../../../documents/domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { Defense } from '../../../defenses/domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { Student } from '../../../students/domain/entities';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { Advisor } from '../../../advisors/domain/entities';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { SendEmailUseCase } from '../../../../toolkit/notifications/application/use-cases';
import { EmailTemplateService } from '../../../../toolkit/notifications/application/services';
import { EmailTemplate, NotificationContextType } from '../../../../toolkit/notifications/domain/enums';
import { SignatureService } from '../../../../toolkit/fabric/application/services';

interface ApproveDocumentRequest {
  approvalId: string;
  userId: string;
}

interface ApproveDocumentResponse {
  approval: Approval;
}

interface LoadedEntities {
  document: Document;
  defense: Defense;
  advisor: Advisor;
  students: Student[];
  approvals: Approval[];
}

@Injectable()
export class ApproveDocumentUseCase {
  private readonly logger = new Logger(ApproveDocumentUseCase.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
    @Inject(forwardRef(() => RegisterOnBlockchainUseCase))
    private readonly registerOnBlockchainUseCase: RegisterOnBlockchainUseCase,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly signatureService: SignatureService,
  ) {}

  async execute(request: ApproveDocumentRequest): Promise<ApproveDocumentResponse> {
    const approval = await this.findAndValidateApproval(request.approvalId);
    const entities = await this.loadRequiredEntities(approval.documentId);
    const isCoordinatorAlsoAdvisor = this.checkCoordinatorIsAdvisor(approval, entities.approvals);

    if (approval.role === ApprovalRole.COORDINATOR) {
      this.validateCoordinatorCanApprove(entities.approvals, isCoordinatorAlsoAdvisor);
    }

    const combinedHash = this.getCombinedHash(entities.document);
    const updatedApproval = await this.processApproval(approval, request.userId, combinedHash);

    if (isCoordinatorAlsoAdvisor) {
      await this.autoApproveAdvisor(entities.approvals, request.userId, combinedHash);
    }

    this.triggerPostApprovalActions(approval.documentId, entities, isCoordinatorAlsoAdvisor);

    return { approval: updatedApproval };
  }

  private async findAndValidateApproval(approvalId: string): Promise<Approval> {
    const approval = await this.approvalRepository.findById(approvalId);

    if (!approval) {
      throw new ApprovalNotFoundError();
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ApprovalAlreadyProcessedError();
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
    const approvals = await this.approvalRepository.findByDocumentId(documentId);

    return { document, defense, advisor, students, approvals };
  }

  private async loadStudents(studentIds: string[]): Promise<Student[]> {
    const students = await Promise.all(
      studentIds.map(id => this.studentRepository.findById(id))
    );
    return students.filter((s): s is Student => s !== null);
  }

  private checkCoordinatorIsAdvisor(approval: Approval, approvals: Approval[]): boolean {
    if (approval.role !== ApprovalRole.COORDINATOR) {
      return false;
    }
    const advisorApproval = approvals.find(a => a.role === ApprovalRole.ADVISOR);
    return advisorApproval?.approverId === approval.approverId;
  }

  private validateCoordinatorCanApprove(approvals: Approval[], isCoordinatorAlsoAdvisor: boolean): void {
    const advisorApproval = approvals.find(a => a.role === ApprovalRole.ADVISOR);
    const studentApprovals = approvals.filter(a => a.role === ApprovalRole.STUDENT);

    const advisorApproved = advisorApproval?.status === ApprovalStatus.APPROVED || isCoordinatorAlsoAdvisor;
    const allStudentsApproved = studentApprovals.every(a => a.status === ApprovalStatus.APPROVED);

    if (!advisorApproved || !allStudentsApproved) {
      const message = isCoordinatorAlsoAdvisor
        ? 'Aluno(s) devem aprovar antes do coordenador'
        : 'Orientador e aluno(s) devem aprovar antes do coordenador';
      throw new ForbiddenException(message);
    }
  }

  private getCombinedHash(document: Document): string {
    if (!document.minutesHash || !document.evaluationHash) {
      throw new Error('Documento sem hashes da ata e avaliação de desempenho');
    }
    return `${document.minutesHash}:${document.evaluationHash}`;
  }

  private async processApproval(approval: Approval, userId: string, combinedHash: string): Promise<Approval> {
    const approvalIdForSign = approval.role === ApprovalRole.COORDINATOR ? undefined : approval.id;
    const cryptographicSignature = await this.signatureService.sign(combinedHash, userId, approvalIdForSign);

    approval.approve(userId, cryptographicSignature);

    return this.approvalRepository.update(approval);
  }

  private async autoApproveAdvisor(approvals: Approval[], userId: string, combinedHash: string): Promise<void> {
    const advisorApproval = approvals.find(a => a.role === ApprovalRole.ADVISOR);

    if (!advisorApproval || advisorApproval.status !== ApprovalStatus.PENDING) {
      return;
    }

    const advisorSignature = await this.signatureService.sign(combinedHash, userId, advisorApproval.id);
    advisorApproval.approve(userId, advisorSignature);
    await this.approvalRepository.update(advisorApproval);
  }

  private triggerPostApprovalActions(
    documentId: string,
    entities: LoadedEntities,
    isCoordinatorAlsoAdvisor: boolean,
  ): void {
    this.registerOnBlockchainUseCase.execute({ documentId }).catch(error => {
      this.logger.error(`Failed to register on blockchain: ${error.message}`);
    });

    this.notifyIfAllApproved(entities, isCoordinatorAlsoAdvisor).catch(error => {
      this.logger.error(`Failed to send approval completion emails: ${error.message}`);
    });
  }

  private async notifyIfAllApproved(entities: LoadedEntities, isCoordinatorAlsoAdvisor: boolean): Promise<void> {
    const { document, defense, advisor, students, approvals } = entities;

    const allApproved = approvals.every(a => a.status === ApprovalStatus.APPROVED);
    if (!allApproved) {
      return;
    }

    const studentsNames = students.map(s => s.name).filter(Boolean).join(', ');
    const coordinatorApproval = approvals.find(a => a.role === ApprovalRole.COORDINATOR);

    const recipientIds = new Set<string>();

    if (coordinatorApproval?.approverId) {
      recipientIds.add(coordinatorApproval.approverId);
    }

    if (!isCoordinatorAlsoAdvisor) {
      recipientIds.add(advisor.id);
    }

    for (const student of students) {
      recipientIds.add(student.id);
    }

    const emailPromises = Array.from(recipientIds).map(userId =>
      this.sendApprovalCompletionEmail(userId, document, defense, studentsNames)
    );

    await Promise.all(emailPromises);
  }

  private async sendApprovalCompletionEmail(
    userId: string,
    document: Document,
    defense: Defense,
    studentsNames: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn(`Usuário ${userId} não encontrado para envio de email`);
      return;
    }

    const emailContent = this.emailTemplateService.generateTemplate(
      EmailTemplate.DOCUMENT_APPROVED,
      {
        documentType: DocumentTypeLabel[DocumentType.MINUTES],
        defenseTitle: defense.title,
        studentsNames,
        approvedBy: 'Todos os aprovadores',
        approvedAt: new Date(),
      },
    );

    await this.sendEmailUseCase.execute({
      userId,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      contextType: NotificationContextType.DOCUMENT_APPROVAL,
      contextId: document.id,
    });
  }
}
