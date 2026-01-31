import { Injectable, Inject, Logger } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalRole } from '../../domain/entities';
import { SendEmailUseCase } from '../../../../toolkit/notifications/application/use-cases';
import { EmailTemplateService } from '../../../../toolkit/notifications/application/services';
import { EmailTemplate, NotificationContextType } from '../../../../toolkit/notifications/domain/enums';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { CertificateQueueService } from '../../../../toolkit/fabric/application/services/certificate-queue.service';
import { Role } from '@prisma/client';

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
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly certificateQueue: CertificateQueueService,
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

    const approvals: Approval[] = [];

    const firstStudent = validStudents[0];
    const studentWithCourse = await this.studentRepository.findById(firstStudent.id);
    const coordinator = studentWithCourse?.courseId
      ? await this.coordinatorRepository.findByCourseId(studentWithCourse.courseId)
      : null;

    const isCoordinatorAlsoAdvisor = coordinator?.id === advisor.id;

    const coordinatorApproval = Approval.create({
      role: ApprovalRole.COORDINATOR,
      documentId: request.documentId,
      approverId: coordinator?.id,
    });
    const createdCoordinatorApproval = await this.approvalRepository.create(coordinatorApproval);
    approvals.push(createdCoordinatorApproval);
    this.sendApprovalEmail(createdCoordinatorApproval, document, defense, advisor, validStudents)
      .catch(error => {
        this.logger.error(`Falha ao enviar email de aprovação: ${error.message}`);
      });

    const advisorApproval = Approval.create({
      role: ApprovalRole.ADVISOR,
      documentId: request.documentId,
      approverId: advisor.id,
    });
    const createdAdvisorApproval = await this.approvalRepository.create(advisorApproval);
    approvals.push(createdAdvisorApproval);

    this.certificateQueue.enqueueCertificateGeneration(advisor.id, advisor.email, Role.ADVISOR, createdAdvisorApproval.id)
      .catch(error => this.logger.error(`Falha ao enfileirar certificado do orientador: ${error.message}`));

    if (!isCoordinatorAlsoAdvisor) {
      this.sendApprovalEmail(createdAdvisorApproval, document, defense, advisor, validStudents)
        .catch(error => {
          this.logger.error(`Falha ao enviar email de aprovação: ${error.message}`);
        });
    }

    for (const student of validStudents) {
      const studentApproval = Approval.create({
        role: ApprovalRole.STUDENT,
        documentId: request.documentId,
        approverId: student.id,
      });
      const createdStudentApproval = await this.approvalRepository.create(studentApproval);
      approvals.push(createdStudentApproval);

      this.certificateQueue.enqueueCertificateGeneration(student.id, student.email, Role.STUDENT, createdStudentApproval.id)
        .catch(error => this.logger.error(`Falha ao enfileirar certificado do aluno: ${error.message}`));
      this.sendApprovalEmail(createdStudentApproval, document, defense, advisor, [student])
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

    const studentsNames = this.getStudentsNames(students);

    switch (approval.role) {
      case ApprovalRole.COORDINATOR:
        if (students.length === 0) {
          this.logger.warn('Nenhum aluno encontrado para buscar coordenador');
          return;
        }
        const firstStudent = students[0];
        const studentWithCourse = await this.studentRepository.findById(firstStudent.id);
        if (!studentWithCourse || !studentWithCourse.courseId) {
          this.logger.warn('Curso do aluno não encontrado');
          return;
        }

        const coordinator = await this.coordinatorRepository.findByCourseId(studentWithCourse.courseId);
        if (!coordinator) {
          this.logger.warn(`Coordenador não encontrado para o curso ${studentWithCourse.courseId}`);
          return;
        }

        const coordinatorUser = await this.userRepository.findById(coordinator.id);
        if (!coordinatorUser) {
          this.logger.warn(`Usuário coordenador não encontrado: ${coordinator.id}`);
          return;
        }

        recipientEmail = coordinatorUser.email;
        userId = coordinatorUser.id;
        break;

      case ApprovalRole.ADVISOR:
        recipientEmail = advisor.email;
        userId = advisor.id;
        break;

      case ApprovalRole.STUDENT:
        if (students.length === 0) {
          this.logger.warn('Nenhum aluno encontrado para envio de email');
          return;
        }
        const student = students[0];
        recipientEmail = student.email;
        userId = student.id;
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

  private getStudentsNames(students: any[]): string {
    return students
      .map(s => s.name)
      .filter(Boolean)
      .join(', ');
  }
}
