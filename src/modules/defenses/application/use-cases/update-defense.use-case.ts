import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { Defense, ExamBoardMember } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import { ICurrentUser } from '../../../../shared/types';

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
      if (!request.currentUser.courseId) {
        throw new ForbiddenException('Coordenador não está associado a nenhum curso');
      }

      const defenseCourseId = await this.defenseRepository.getDefenseCourseId(request.id);
      if (defenseCourseId !== request.currentUser.courseId) {
        throw new ForbiddenException('Coordenador só pode atualizar defesas do seu curso');
      }
    }

    defense.update({
      title: request.title,
      defenseDate: request.defenseDate,
      location: request.location,
    });

    // Atualizar exam board se fornecido
    if (request.examBoard !== undefined) {
      (defense as any).props.examBoard = request.examBoard;
      (defense as any).props.updatedAt = new Date();
    }

    return this.defenseRepository.update(defense);
  }
}
