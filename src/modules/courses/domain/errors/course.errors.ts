import { ConflictException, NotFoundException } from '@nestjs/common';

export class CourseNotFoundError extends NotFoundException {
  constructor(identifier: string) {
    super(`Curso não encontrado: ${identifier}`);
  }
}

export class CourseCodigoAlreadyExistsError extends ConflictException {
  constructor(codigo: string) {
    super(`Código de curso já cadastrado: ${codigo}`);
  }
}
