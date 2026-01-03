import { ConflictException, NotFoundException } from '@nestjs/common';

export class AdvisorNotFoundError extends NotFoundException {
  constructor(identifier: string) {
    super(`Orientador não encontrado: ${identifier}`);
  }
}

export class AdvisorUserAlreadyExistsError extends ConflictException {
  constructor(userId: string) {
    super(`Usuário já possui vínculo como orientador: ${userId}`);
  }
}
