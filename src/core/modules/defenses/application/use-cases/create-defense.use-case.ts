import { Injectable, Inject, ForbiddenException, Logger } from '@nestjs/common';
import { Role, DefenseResult, DefenseStatus } from '@prisma/client';
import { Defense, ExamBoardMember } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError, StudentAlreadyHasActiveDefenseError } from '../../domain/errors';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICurrentUser } from '../../../../../shared/types';
import { NotifyDefenseScheduledUseCase } from './notify-defense-scheduled.use-case';
import { Student } from '../../../students/domain/entities';

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
    await this.validateAdvisor(request.advisorId);
    const students = await this.validateAndFetchStudents(request.studentIds);
    this.validateCoordinatorAccess(students, request.currentUser);

    const defense = this.createDefenseEntity(request);
    const createdDefense = await this.defenseRepository.create(defense);

    this.sendScheduledNotification(createdDefense.id);

    return createdDefense;
  }

  private async validateAdvisor(advisorId: string): Promise<void> {
    const advisor = await this.advisorRepository.findById(advisorId);
    if (!advisor) {
      throw new DefenseNotFoundError();
    }
  }

  private async validateAndFetchStudents(studentIds: string[]) {
    const students = [];

    for (const studentId of studentIds) {
      const student = await this.studentRepository.findById(studentId);
      if (!student) {
        throw new DefenseNotFoundError();
      }

      const hasActive = await this.defenseRepository.hasActiveDefense(studentId);
      if (hasActive) {
        throw new StudentAlreadyHasActiveDefenseError();
      }

      students.push(student);
    }

    return students;
  }

  private validateCoordinatorAccess(students: Student[], currentUser?: ICurrentUser): void {
    if (currentUser?.role !== Role.COORDINATOR) {
      return;
    }

    if (!currentUser.courseId) {
      throw new ForbiddenException('Coordenador não está associado a nenhum curso');
    }

    const studentsWithDifferentCourse = students.filter(
      student => student.courseId && student.courseId !== currentUser.courseId
    );

    if (studentsWithDifferentCourse.length > 0) {
      throw new ForbiddenException('Não é permitido criar defesa para alunos que já pertencem a outro curso');
    }
  }

  private createDefenseEntity(request: CreateDefenseRequest): Defense {
    return Defense.create({
      title: request.title,
      defenseDate: request.defenseDate,
      location: request.location,
      advisorId: request.advisorId,
      studentIds: request.studentIds,
      examBoard: request.examBoard,
      result: DefenseResult.PENDING,
      status: DefenseStatus.SCHEDULED,
    });
  }

  private sendScheduledNotification(defenseId: string): void {
    this.notifyDefenseScheduledUseCase.execute(defenseId).catch((error) => {
      this.logger.error(`Failed to send defense scheduled notification: ${error.message}`);
    });
  }
}
