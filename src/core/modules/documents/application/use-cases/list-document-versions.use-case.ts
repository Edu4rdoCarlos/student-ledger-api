import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { Document } from '../../domain/entities';

@Injectable()
export class ListDocumentVersionsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(defenseId: string): Promise<Document[]> {
    const defense = await this.defenseRepository.findById(defenseId);
    if (!defense) {
      throw new NotFoundException('Defense não encontrada');
    }

    const versions = await this.documentRepository.findByDefenseId(defenseId);
    return versions.sort((a, b) => b.version - a.version);
  }
}
