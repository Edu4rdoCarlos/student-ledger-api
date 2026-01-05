import { Injectable, Inject } from '@nestjs/common';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { SendEmailUseCase } from '../../../notifications/application/use-cases';
import { NotificationContextType, EmailTemplate } from '../../../notifications/domain/enums';
import { EmailTemplateService } from '../../../notifications/application/services';
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
    private readonly emailTemplateService: EmailTemplateService,
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

    const advisorUser = await this.userRepository.findById(advisor.userId);
    if (!advisorUser) {
      return;
    }

    const students = await Promise.all(
      defense.studentIds.map(id => this.studentRepository.findById(id))
    );

    const validStudents = students.filter(s => s !== null);

    const studentUserIds = validStudents.map(s => s.userId);
    const studentUsers = await this.userRepository.findByIds(studentUserIds);

    const studentUserMap = new Map(studentUsers.map(u => [u.id, u]));

    const studentsNames = validStudents
      .map(s => {
        const user = studentUserMap.get(s.userId);
        return user?.name;
      })
      .filter(Boolean)
      .join(', ');

    const advisorEmail = this.emailTemplateService.generateTemplate(
      EmailTemplate.DEFENSE_SCHEDULED_ADVISOR,
      {
        defenseTitle: defense.title,
        defenseDate: defense.defenseDate,
        studentsNames,
      }
    );

    await this.sendEmailUseCase.execute({
      userId: advisor.userId,
      to: advisorUser.email,
      subject: advisorEmail.subject,
      html: advisorEmail.html,
      contextType: NotificationContextType.DEFENSE_CREATED,
      contextId: defense.id,
    });

    for (const student of validStudents) {
      const studentUser = studentUserMap.get(student.userId);
      if (!studentUser) {
        continue;
      }

      const studentEmail = this.emailTemplateService.generateTemplate(
        EmailTemplate.DEFENSE_SCHEDULED_STUDENT,
        {
          defenseTitle: defense.title,
          defenseDate: defense.defenseDate,
          advisorName: advisorUser.name,
        }
      );

      await this.sendEmailUseCase.execute({
        userId: student.userId,
        to: studentUser.email,
        subject: studentEmail.subject,
        html: studentEmail.html,
        contextType: NotificationContextType.DEFENSE_CREATED,
        contextId: defense.id,
      });
    }
  }
}
