import { Injectable, Inject, ForbiddenException, Logger } from '@nestjs/common';
import { Defense, ExamBoardMember } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError, StudentAlreadyHasActiveDefenseError } from '../../domain/errors';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICurrentUser } from '../../../../shared/types';
import { NotifyDefenseScheduledUseCase } from './notify-defense-scheduled.use-case';

interface CreateDefenseRequest {
  title: string;
  defenseDate: Date;
  location?: string;
  advisorId: string;
  studentIds: string[];
  examBoard?: ExamBoardMember[];
  currentUser?: ICurrentUser;
}

@Injectable()
export class CreateDefenseUseCase {
  private readonly logger = new Logger(CreateDefenseUseCase.name);

  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    private readonly notifyDefenseScheduledUseCase: NotifyDefenseScheduledUseCase,
  ) {}

  async execute(request: CreateDefenseRequest): Promise<Defense> {
    const advisor = await this.advisorRepository.findById(request.advisorId);
    if (!advisor) {
      throw new DefenseNotFoundError();
    }

    const students = [];
    for (const studentId of request.studentIds) {
      const student = await this.studentRepository.findById(studentId);
      if (!student) {
        throw new DefenseNotFoundError();
      }
      students.push(student);

      const hasActive = await this.defenseRepository.hasActiveDefense(studentId);
      if (hasActive) {
        throw new StudentAlreadyHasActiveDefenseError();
      }
    }

    if (request.currentUser?.role === 'COORDINATOR') {
      if (!request.currentUser.courseId) {
        throw new ForbiddenException('Coordenador não está associado a nenhum curso');
      }

      const studentsWithDifferentCourse = students.filter(
        student => student.courseId && student.courseId !== request.currentUser!.courseId
      );

      if (studentsWithDifferentCourse.length > 0) {
        throw new ForbiddenException('Não é permitido criar defesa para alunos que já pertencem a outro curso');
      }
    }

    const defense = Defense.create({
      title: request.title,
      defenseDate: request.defenseDate,
      location: request.location,
      advisorId: request.advisorId,
      studentIds: request.studentIds,
      examBoard: request.examBoard,
      result: 'PENDING',
      status: 'SCHEDULED',
    });

    const createdDefense = await this.defenseRepository.create(defense);

    this.notifyDefenseScheduledUseCase.execute(createdDefense.id).catch((error) => {
      this.logger.error(`Failed to send defense scheduled notification: ${error.message}`);
    });

    return createdDefense;
  }
}
