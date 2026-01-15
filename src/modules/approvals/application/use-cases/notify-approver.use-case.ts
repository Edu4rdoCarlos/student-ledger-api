import { Injectable, Inject, Logger } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { ApprovalRole } from '../../domain/entities';
import { ApprovalNotFoundError } from '../../domain/errors';
import { SendEmailUseCase } from '../../../notifications/application/use-cases';
import { EmailTemplateService } from '../../../notifications/application/services';
import { EmailTemplate, NotificationContextType } from '../../../notifications/domain/enums';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';

export interface NotifyApproverRequest {
  approvalId: string;
}

export interface NotifyApproverResponse {
  success: boolean;
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
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async execute(request: NotifyApproverRequest): Promise<NotifyApproverResponse> {
    const approval = await this.approvalRepository.findById(request.approvalId);
    if (!approval) {
      throw new ApprovalNotFoundError();
    }

    const document = await this.documentRepository.findById(approval.documentId);
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

    await this.sendApprovalNotification(approval, document, defense, advisor, validStudents);

    return { success: true };
  }

  private async sendApprovalNotification(
    approval: any,
    document: any,
    defense: any,
    advisor: any,
    students: any[],
  ): Promise<void> {
    let recipientEmail: string;
    let userId: string;

    const studentsNames = this.getStudentsNames(students);

    switch (approval.role) {
      case ApprovalRole.COORDINATOR:
        if (students.length === 0) {
          throw new Error('Nenhum aluno encontrado para buscar coordenador');
        }
        const firstStudent = students[0];
        const studentWithCourse = await this.studentRepository.findById(firstStudent.id);
        if (!studentWithCourse || !studentWithCourse.courseId) {
          throw new Error('Curso do aluno não encontrado');
        }

        const coordinator = await this.coordinatorRepository.findByCourseId(studentWithCourse.courseId);
        if (!coordinator) {
          throw new Error(`Coordenador não encontrado para o curso ${studentWithCourse.courseId}`);
        }

        const coordinatorUser = await this.userRepository.findById(coordinator.id);
        if (!coordinatorUser) {
          throw new Error(`Usuário coordenador não encontrado: ${coordinator.id}`);
        }

        recipientEmail = coordinatorUser.email;
        userId = coordinatorUser.id;
        break;

      case ApprovalRole.ADVISOR:
        recipientEmail = advisor.email;
        userId = advisor.id;
        break;

      case ApprovalRole.STUDENT:
        if (!approval.approverId) {
          throw new Error('Aprovador do aluno não definido');
        }
        const student = await this.studentRepository.findById(approval.approverId);
        if (!student) {
          throw new Error('Aluno não encontrado');
        }
        recipientEmail = student.email;
        userId = student.id;
        break;

      default:
        throw new Error(`Tipo de aprovação não reconhecido: ${approval.role}`);
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

    this.logger.log(`Notificação enviada para ${recipientEmail} (approval: ${approval.id})`);
  }

  private getStudentsNames(students: any[]): string {
    return students
      .map(s => s.name)
      .filter(Boolean)
      .join(', ');
  }
}
