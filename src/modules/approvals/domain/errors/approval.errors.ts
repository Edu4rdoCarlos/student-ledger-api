import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

export class ApprovalNotFoundError extends NotFoundException {
  constructor() {
    super('Aprovação não encontrada');
  }
}

export class InvalidVerificationCodeError extends BadRequestException {
  constructor() {
    super('Código de verificação inválido ou expirado');
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

export class UnauthorizedApprovalError extends ForbiddenException {
  constructor() {
    super('Você não tem permissão para processar esta aprovação');
  }
}

export class DocumentAlreadyApprovedError extends BadRequestException {
  constructor() {
    super('Este documento já foi totalmente aprovado');
  }
}

export class DocumentRejectedError extends BadRequestException {
  constructor() {
    super('Este documento foi rejeitado e não pode mais ser aprovado');
  }
}
