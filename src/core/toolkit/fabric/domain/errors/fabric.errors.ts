import {
  BadRequestException,
  ServiceUnavailableException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

export class FabricConnectionError extends ServiceUnavailableException {
  constructor(message: string) {
    super(`Fabric não está acessível: ${message}`);
  }
}

export class FabricCertificateNotFoundError extends BadRequestException {
  constructor(certType: string, path: string) {
    super(`${certType} não encontrado: ${path}`);
  }
}

export class FabricTransactionError extends BadRequestException {
  constructor(operation: string, reason: string) {
    super(`Falha na operação '${operation}': ${reason}`);
  }
}

export class FabricDocumentNotFoundError extends NotFoundException {
  constructor(matricula: string, versao?: number) {
    const msg = versao
      ? `Documento não encontrado para matrícula ${matricula} versão ${versao}`
      : `Documento não encontrado para matrícula ${matricula}`;
    super(msg);
  }
}

export class FabricUnauthorizedOrgError extends ForbiddenException {
  constructor(role: string, orgName: string) {
    super(`Usuário com role '${role}' não tem permissão para conectar como '${orgName}'`);
  }
}

export class FabricInvalidSignaturesError extends BadRequestException {
  constructor() {
    super('Documento requer 3 assinaturas válidas: coordenador, orientador e aluno');
  }
}
