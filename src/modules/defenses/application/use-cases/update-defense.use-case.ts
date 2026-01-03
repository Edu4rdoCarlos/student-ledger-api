import { Injectable, Inject } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';

interface UpdateDefenseRequest {
  id: string;
  title?: string;
  defenseDate?: Date;
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

    defense.update({
      title: request.title,
      defenseDate: request.defenseDate,
    });

    return this.defenseRepository.update(defense);
  }
}
