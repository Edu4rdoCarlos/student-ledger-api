import { ConflictException, NotFoundException } from '@nestjs/common';

export class CourseNotFoundError extends NotFoundException {
  constructor(identifier: string) {
    super(`Curso não encontrado: ${identifier}`);
  }
}

export class CourseCodeAlreadyExistsError extends ConflictException {
  constructor(code: string) {
    super(`Código de curso já cadastrado: ${code}`);
  }
}
