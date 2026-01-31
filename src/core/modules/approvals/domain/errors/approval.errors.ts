import { NotFoundException, BadRequestException } from '@nestjs/common';

export class ApprovalNotFoundError extends NotFoundException {
  constructor() {
    super('Aprovação não encontrada');
  }
}

export class ApprovalAlreadyProcessedError extends BadRequestException {
  constructor() {
    super('Esta aprovação já foi processada');
  }
}

export class MissingJustificationError extends BadRequestException {
  constructor() {
    super('Justificativa é obrigatória para rejeição');
  }
}
