import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { Defense, ExamBoardMember } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import { ICurrentUser } from '../../../../../shared/types';

interface UpdateDefenseRequest {
  id: string;
  title?: string;
  defenseDate?: Date;
  location?: string;
  examBoard?: ExamBoardMember[];
  currentUser?: ICurrentUser;
}

@Injectable()
export class UpdateDefenseUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(request: UpdateDefenseRequest): Promise<Defense> {
    const defense = await this.defenseRepository.findById(request.id);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    if (request.currentUser?.role === 'COORDINATOR') {
      await this.validateCoordinatorAccess(request.id, request.currentUser.courseId);
    }

    if (request.title !== undefined) {
      defense.changeTitle(request.title);
    }

    if (request.defenseDate !== undefined) {
      defense.changeDefenseDate(request.defenseDate);
    }

    if (request.location !== undefined) {
      defense.changeLocation(request.location);
    }

    if (request.examBoard !== undefined) {
      defense.updateExamBoard(request.examBoard);
    }

    return this.defenseRepository.update(defense);
  }

  private async validateCoordinatorAccess(defenseId: string, courseId?: string): Promise<void> {
    if (!courseId) {
      throw new ForbiddenException('Coordenador não está associado a nenhum curso');
    }

    const defenseCourseId = await this.defenseRepository.getDefenseCourseId(defenseId);
    if (defenseCourseId !== courseId) {
      throw new ForbiddenException('Coordenador só pode atualizar defesas do seu curso');
    }
  }
}
