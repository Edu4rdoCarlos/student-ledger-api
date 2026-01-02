import { ConflictException, NotFoundException } from '@nestjs/common';

export class DocumentNotFoundError extends NotFoundException {
  constructor(identifier: string) {
    super(`Documento não encontrado: ${identifier}`);
  }
}

export class DocumentHashAlreadyExistsError extends ConflictException {
  constructor() {
    super('Documento com este hash já existe');
  }
}

export class DocumentAlreadyApprovedError extends ConflictException {
  constructor() {
    super('Documento já foi aprovado');
  }
}

export class DocumentInactiveError extends ConflictException {
  constructor() {
    super('Documento está inativo');
  }
}
