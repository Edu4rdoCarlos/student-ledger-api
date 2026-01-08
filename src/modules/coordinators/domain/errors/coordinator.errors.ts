import { NotFoundException } from '@nestjs/common';

export class CoordinatorNotFoundError extends NotFoundException {
  constructor(id: string) {
    super(`Coordenador com ID ${id} não encontrado`);
  }
}

export class CoordinatorAlreadyExistsError extends NotFoundException {
  constructor() {
    super('Usuário já está cadastrado como coordenador');
  }
}

export class CourseRequiredError extends NotFoundException {
  constructor() {
    super('Coordenador deve estar obrigatoriamente alocado em um curso');
  }
}
