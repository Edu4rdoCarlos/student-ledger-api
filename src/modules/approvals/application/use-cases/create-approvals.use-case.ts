import { Injectable, Inject, Logger } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalRole } from '../../domain/entities';
import { SendEmailUseCase } from '../../../notifications/application/use-cases';
import { EmailTemplateService } from '../../../notifications/application/services';
import { EmailTemplate, NotificationContextType } from '../../../notifications/domain/enums';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';

interface CreateApprovalsRequest {
  documentId: string;
}

interface CreateApprovalsResponse {
  approvals: Approval[];
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
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async execute(request: CreateApprovalsRequest): Promise<CreateApprovalsResponse> {
    const document = await this.documentRepository.findById(request.documentId);
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

    const students = await Promise.all(
      defense.studentIds.map(id => this.studentRepository.findById(id))
    );
    const validStudents = students.filter(s => s !== null);

    if (validStudents.length === 0) {
      throw new Error('Nenhum aluno encontrado para a defesa');
    }

    const approvalRoles = [
      ApprovalRole.COORDINATOR,
      ApprovalRole.ADVISOR,
      ApprovalRole.STUDENT,
    ];

    const approvals: Approval[] = [];

    for (const role of approvalRoles) {
      const approval = Approval.create({
        role,
        documentId: request.documentId,
      });

      const createdApproval = await this.approvalRepository.create(approval);
      approvals.push(createdApproval);

      this.sendApprovalEmail(createdApproval, document, defense, advisor, validStudents)
        .catch(error => {
          this.logger.error(`Falha ao enviar email de aprovação: ${error.message}`);
        });
    }

    return { approvals };
  }

  private async sendApprovalEmail(
    approval: Approval,
    document: any,
    defense: any,
    advisor: any,
    students: any[],
  ): Promise<void> {
    let recipientEmail: string;
    let userId: string;

    const studentsNames = await this.getStudentsNames(students);

    switch (approval.role) {
      case ApprovalRole.COORDINATOR:
        return;

      case ApprovalRole.ADVISOR:
        const advisorUser = await this.userRepository.findById(advisor.userId);
        if (!advisorUser) {
          this.logger.warn(`Usuário do orientador não encontrado: ${advisor.userId}`);
          return;
        }
        recipientEmail = advisorUser.email;
        userId = advisorUser.id;
        break;

      case ApprovalRole.STUDENT:
        if (students.length === 0) {
          this.logger.warn('Nenhum aluno encontrado para envio de email');
          return;
        }
        const student = students[0];
        const studentUser = await this.userRepository.findById(student.userId);
        if (!studentUser) {
          this.logger.warn(`Usuário do aluno não encontrado: ${student.userId}`);
          return;
        }
        recipientEmail = studentUser.email;
        userId = studentUser.id;
        break;

      default:
        this.logger.warn(`Tipo de aprovação não reconhecido: ${approval.role}`);
        return;
    }

    const emailContent = this.emailTemplateService.generateTemplate(
      EmailTemplate.DOCUMENT_APPROVAL_REQUEST,
      {
        documentType: document.type,
        defenseTitle: defense.title,
        studentsNames,
        submittedAt: document.createdAt,
        approvalId: approval.id,
        documentId: document.id,
      },
    );

    await this.sendEmailUseCase.execute({
      userId,
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      contextType: NotificationContextType.DOCUMENT_APPROVAL,
      contextId: document.id,
    });
  }

  private async getStudentsNames(students: any[]): Promise<string> {
    const userIds = students.map(s => s.userId);
    const users = await this.userRepository.findByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, u]));

    return students
      .map(s => {
        const user = userMap.get(s.userId);
        return user?.name;
      })
      .filter(Boolean)
      .join(', ');
  }
}
