import { BadRequestException, ServiceUnavailableException, NotFoundException } from '@nestjs/common';

export class IpfsConnectionError extends ServiceUnavailableException {
  constructor(message: string) {
    super(`IPFS não está acessível: ${message}`);
  }
}

export class IpfsUploadError extends BadRequestException {
  constructor(filename: string, reason: string) {
    super(`Falha no upload do arquivo '${filename}': ${reason}`);
  }
}

export class IpfsFileNotFoundError extends NotFoundException {
  constructor(cid: string) {
    super(`Arquivo não encontrado no IPFS: ${cid}`);
  }
}

export class IpfsInvalidCidError extends BadRequestException {
  constructor(cid: string) {
    super(`CID inválido: ${cid}. Formato esperado: CIDv0 (Qm...) ou CIDv1 (bafy...)`);
  }
}

export class IpfsPinError extends BadRequestException {
  constructor(cid: string, action: 'pin' | 'unpin') {
    super(`Falha ao ${action === 'pin' ? 'fixar' : 'remover fixação do'} CID: ${cid}`);
  }
}
