import { NotFoundException } from '@nestjs/common';

export class AdvisorNotFoundError extends NotFoundException {
  constructor(identifier: string) {
    super(`Orientador não encontrado: ${identifier}`);
  }
}
