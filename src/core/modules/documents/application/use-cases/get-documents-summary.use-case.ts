import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_REPOSITORY, IDocumentRepository } from '../ports';

@Injectable()
export class GetDocumentsSummaryUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute() {
    return this.documentRepository.getSummary();
  }
}
