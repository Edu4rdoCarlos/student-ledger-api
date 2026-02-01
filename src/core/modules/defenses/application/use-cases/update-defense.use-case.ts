import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
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
    const defense = await this.findAndValidateDefense(request.id);
    this.validateAccess(request.id, request.currentUser);
    this.updateDefenseFields(defense, request);

    return this.defenseRepository.update(defense);
  }

  private async findAndValidateDefense(id: string): Promise<Defense> {
    const defense = await this.defenseRepository.findById(id);
    if (!defense) {
      throw new DefenseNotFoundError();
    }
    return defense;
  }

  private validateAccess(defenseId: string, currentUser?: ICurrentUser): void {
    if (currentUser?.role === Role.COORDINATOR) {
      this.validateCoordinatorAccess(defenseId, currentUser.courseId);
    }
  }

  private updateDefenseFields(defense: Defense, request: UpdateDefenseRequest): void {
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
