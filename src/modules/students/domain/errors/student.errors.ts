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

export class StudentUserAlreadyExistsError extends ConflictException {
  constructor(userId: string) {
    super(`Usuário já possui vínculo como aluno: ${userId}`);
  }
}

export class UserNotFoundError extends NotFoundException {
  constructor(userId: string) {
    super(`Usuário não encontrado: ${userId}`);
  }
}

export class CourseNotFoundError extends NotFoundException {
  constructor(courseId: string) {
    super(`Curso não encontrado: ${courseId}`);
  }
}
