import { Injectable, Inject, Logger, forwardRef, ForbiddenException } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalStatus, ApprovalRole } from '../../domain/entities';
import {
  ApprovalNotFoundError,
  ApprovalAlreadyProcessedError,
} from '../../domain/errors';
import { RegisterOnBlockchainUseCase } from './register-on-blockchain.use-case';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { SendEmailUseCase } from '../../../notifications/application/use-cases';
import { EmailTemplateService } from '../../../notifications/application/services';
import { EmailTemplate, NotificationContextType } from '../../../notifications/domain/enums';
import { SignatureService } from '../../../fabric/application/services';

interface ApproveDocumentRequest {
  approvalId: string;
  userId: string;
}

interface ApproveDocumentResponse {
  approval: Approval;
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
    const approval = await this.approvalRepository.findById(request.approvalId);

    if (!approval) {
      throw new ApprovalNotFoundError();
    }

    if (approval.status !== 'PENDING') {
      throw new ApprovalAlreadyProcessedError();
    }

    if (approval.role === ApprovalRole.COORDINATOR) {
      await this.validateCoordinatorCanApprove(approval.documentId);
    }

    const document = await this.documentRepository.findById(approval.documentId);
    if (!document) {
      throw new Error('Documento não encontrado');
    }
    if (!document.minutesHash || !document.evaluationHash) {
      throw new Error('Documento sem hashes da ata e avaliação de desempenho');
    }

    // Creates a combined hash for signing both documents together
    const combinedHash = `${document.minutesHash}:${document.evaluationHash}`;
    const cryptographicSignature = await this.signatureService.sign(
      combinedHash,
      request.userId,
    );

    approval.approve(request.userId, cryptographicSignature);

    const updatedApproval = await this.approvalRepository.update(approval);

    await this.autoApproveAdvisorIfCoordinatorIsAdvisor(approval, request.userId, combinedHash);

    this.registerOnBlockchainUseCase.execute({ documentId: approval.documentId }).catch((error) => {
      this.logger.error(`Failed to register on blockchain: ${error.message}`);
    });

    this.checkAndNotifyAllApproved(approval.documentId).catch((error) => {
      this.logger.error(`Failed to send approval completion emails: ${error.message}`);
    });

    return { approval: updatedApproval };
  }

  private async validateCoordinatorCanApprove(documentId: string): Promise<void> {
    const approvals = await this.approvalRepository.findByDocumentId(documentId);

    const advisorApproval = approvals.find(a => a.role === ApprovalRole.ADVISOR);
    const studentApprovals = approvals.filter(a => a.role === ApprovalRole.STUDENT);

    const advisorApproved = advisorApproval?.status === ApprovalStatus.APPROVED;
    const allStudentsApproved = studentApprovals.every(a => a.status === ApprovalStatus.APPROVED);

    if (!advisorApproved || !allStudentsApproved) {
      throw new ForbiddenException('Orientador e aluno(s) devem aprovar antes do coordenador');
    }
  }

  private async autoApproveAdvisorIfCoordinatorIsAdvisor(
    approval: Approval,
    userId: string,
    combinedHash: string,
  ): Promise<void> {
    if (approval.role !== ApprovalRole.COORDINATOR) {
      return;
    }

    const approvals = await this.approvalRepository.findByDocumentId(approval.documentId);
    const advisorApproval = approvals.find(a => a.role === ApprovalRole.ADVISOR);

    if (!advisorApproval || advisorApproval.status !== ApprovalStatus.PENDING) {
      return;
    }

    const isCoordinatorAlsoAdvisor = advisorApproval.approverId === approval.approverId;

    if (isCoordinatorAlsoAdvisor) {
      const advisorSignature = await this.signatureService.sign(combinedHash, userId);
      advisorApproval.approve(userId, advisorSignature);
      await this.approvalRepository.update(advisorApproval);
    }
  }

  private async checkAndNotifyAllApproved(documentId: string): Promise<void> {
    const approvals = await this.approvalRepository.findByDocumentId(documentId);

    const allApproved = approvals.every(approval => approval.status === ApprovalStatus.APPROVED);

    if (!allApproved) {
      return;
    }

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      this.logger.warn(`Documento ${documentId} não encontrado`);
      return;
    }

    const defense = await this.defenseRepository.findById(document.defenseId);
    if (!defense) {
      this.logger.warn(`Defesa ${document.defenseId} não encontrada`);
      return;
    }

    const students = await Promise.all(
      defense.studentIds.map(id => this.studentRepository.findById(id))
    );
    const validStudents = students.filter(s => s !== null);

    const advisor = await this.advisorRepository.findById(defense.advisorId);
    if (!advisor) {
      this.logger.warn(`Orientador ${defense.advisorId} não encontrado`);
      return;
    }

    const studentsNames = validStudents.map(s => s.name).filter(Boolean).join(', ');

    const coordinatorApproval = approvals.find(a => a.role === 'COORDINATOR');

    const emailPromises = [];

    if (coordinatorApproval?.approverId) {
      emailPromises.push(this.sendApprovalCompletionEmail(
        coordinatorApproval.approverId,
        document,
        defense,
        studentsNames
      ));
    }

    emailPromises.push(this.sendApprovalCompletionEmail(
      advisor.id,
      document,
      defense,
      studentsNames
    ));

    for (const student of validStudents) {
      emailPromises.push(this.sendApprovalCompletionEmail(
        student.id,
        document,
        defense,
        studentsNames
      ));
    }

    await Promise.all(emailPromises);
  }

  private async sendApprovalCompletionEmail(
    userId: string,
    document: any,
    defense: any,
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
        documentType: document.type,
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
