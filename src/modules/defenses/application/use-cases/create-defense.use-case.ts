import { Injectable, Inject } from '@nestjs/common';
import { Defense, ExamBoardMember } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError, StudentAlreadyHasActiveDefenseError } from '../../domain/errors';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';

interface CreateDefenseRequest {
  title: string;
  defenseDate: Date;
  location?: string;
  advisorId: string;
  studentIds: string[];
  examBoard?: ExamBoardMember[];
}

@Injectable()
export class CreateDefenseUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
  ) {}

  async execute(request: CreateDefenseRequest): Promise<Defense> {
    const advisor = await this.advisorRepository.findById(request.advisorId);
    if (!advisor) {
      throw new DefenseNotFoundError();
    }

    for (const studentId of request.studentIds) {
      const student = await this.studentRepository.findById(studentId);
      if (!student) {
        throw new DefenseNotFoundError();
      }

      const hasActive = await this.defenseRepository.hasActiveDefense(studentId);
      if (hasActive) {
        throw new StudentAlreadyHasActiveDefenseError();
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

    return this.defenseRepository.create(defense);
  }
}
