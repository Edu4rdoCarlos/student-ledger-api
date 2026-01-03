import { ConflictException, NotFoundException } from '@nestjs/common';

export class StudentNotFoundError extends NotFoundException {
  constructor(identifier: string) {
    super(`Aluno não encontrado: ${identifier}`);
  }
}

export class StudentMatriculaAlreadyExistsError extends ConflictException {
  constructor(matricula: string) {
    super(`Matrícula já cadastrada: ${matricula}`);
  }
}
