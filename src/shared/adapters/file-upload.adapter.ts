import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HashUtil } from '../../core/modules/documents/infra/utils/hash.util';
import { IpfsService } from '../../core/toolkit/ipfs/ipfs.service';

export interface FileUploadResult {
  hash: string;
  cid: string;
}

@Injectable()
export class FileUploadAdapter {
  private readonly logger = new Logger(FileUploadAdapter.name);

  constructor(
    private readonly hashUtil: HashUtil,
    private readonly ipfsService: IpfsService,
  ) {}

  async uploadFile(file: Buffer, filename: string): Promise<FileUploadResult> {
    const hash = this.hashUtil.calculateSha256(file);

    try {
      const ipfsResult = await this.ipfsService.uploadFile(file, filename);

      if ('queued' in ipfsResult) {
        this.logger.warn(`Upload IPFS de ${filename} enfileirado - será processado em breve`);
        throw new InternalServerErrorException(
          'Sistema de armazenamento temporariamente indisponível. Tente novamente em alguns minutos.'
        );
      }

      return {
        hash,
        cid: ipfsResult.cid,
      };
    } catch (error) {
      this.logger.error(`Falha ao fazer upload de ${filename} para IPFS: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao fazer upload dos arquivos. Tente novamente.');
    }
  }

  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; filename: string }>
  ): Promise<FileUploadResult[]> {
    return Promise.all(
      files.map(file => this.uploadFile(file.buffer, file.filename))
    );
  }
}
