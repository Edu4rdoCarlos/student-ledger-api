import { Injectable, Inject } from '@nestjs/common';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { SendEmailUseCase } from '../../../../toolkit/notifications/application/use-cases';
import { NotificationContextType, EmailTemplate } from '../../../../toolkit/notifications/domain/enums';
import { EmailTemplateRenderer } from '../../../../toolkit/notifications/infra/templates';
import { STUDENT_REPOSITORY, IStudentRepository } from '../../../students/application/ports';
import { ADVISOR_REPOSITORY, IAdvisorRepository } from '../../../advisors/application/ports';
import { USER_REPOSITORY, IUserRepository } from '../../../auth/application/ports';

@Injectable()
export class NotifyDefenseScheduledUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly emailTemplateRenderer: EmailTemplateRenderer,
  ) {}

  async execute(defenseId: string): Promise<void> {
    const defense = await this.defenseRepository.findById(defenseId);
    if (!defense) {
      return;
    }

    const advisor = await this.advisorRepository.findById(defense.advisorId);
    if (!advisor) {
      return;
    }

    const students = await Promise.all(
      defense.studentIds.map(id => this.studentRepository.findById(id))
    );

    const validStudents = students.filter(s => s !== null);

    const studentsNames = validStudents
      .map(s => s.name)
      .filter(Boolean)
      .join(', ');

    const emailData = {
      defenseTitle: defense.title,
      defenseDate: defense.defenseDate,
      studentsNames,
      advisorName: advisor.name,
      location: defense.location,
    };

    const email = this.emailTemplateRenderer.generateTemplate(
      EmailTemplate.DEFENSE_SCHEDULED,
      emailData
    );

    await this.sendEmailUseCase.execute({
      userId: advisor.userId,
      to: advisor.email,
      subject: email.subject,
      html: email.html,
      contextType: NotificationContextType.DEFENSE_CREATED,
      contextId: defense.id,
    });

    for (const student of validStudents) {
      await this.sendEmailUseCase.execute({
        userId: student.userId,
        to: student.email,
        subject: email.subject,
        html: email.html,
        contextType: NotificationContextType.DEFENSE_CREATED,
        contextId: defense.id,
      });
    }

    if (defense.examBoard && defense.examBoard.length > 0) {
      for (const member of defense.examBoard) {
        await this.sendEmailUseCase.execute({
          to: member.email,
          subject: email.subject,
          html: email.html,
          contextType: NotificationContextType.DEFENSE_CREATED,
          contextId: defense.id,
        });
      }
    }
  }
}
