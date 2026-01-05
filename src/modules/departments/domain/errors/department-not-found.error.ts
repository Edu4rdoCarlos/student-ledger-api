import { NotFoundException } from '@nestjs/common';

export class DepartmentNotFoundError extends NotFoundException {
  constructor(id: string) {
    super(`Departamento com ID ${id} não encontrado`);
  }
}
