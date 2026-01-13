import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { ValidateDocumentResponseDto, SimpleDocumentDto } from '../../presentation/dtos';
import { HashUtil } from '../../infra/utils/hash.util';
import { Document, DocumentStatus } from '../../domain/entities';
import { FabricService } from '../../../fabric/fabric.service';
import { FabricUser } from '../../../fabric/application/ports';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { ICurrentUser } from '../../../../shared/types';

@Injectable()
export class ValidateDocumentUseCase {
  private readonly logger = new Logger(ValidateDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly hashUtil: HashUtil,
    private readonly fabricService: FabricService,
    private readonly ipfsService: IpfsService,
  ) {}

  private toSimpleDto(document: Document): SimpleDocumentDto {
    return {
      id: document.id,
      documentHash: document.documentHash,
      documentCid: document.documentCid,
      status: document.status,
    };
  }

  async execute(
    fileBufferOrHash: Buffer | string,
    currentUser: ICurrentUser
  ): Promise<ValidateDocumentResponseDto> {
    const isHash = typeof fileBufferOrHash === 'string';
    const hash = isHash ? fileBufferOrHash : this.hashUtil.calculateSha256(fileBufferOrHash);

    const document = await this.tryFindDocumentByHash(hash);

    if (!document) {
      if (isHash) {
        return await this.validateHashOnBlockchain();
      }
      return await this.validateOnBlockchain(fileBufferOrHash, hash, currentUser);
    }

    return this.validateDocumentStatus(document);
  }

  private async tryFindDocumentByHash(hash: string): Promise<Document | null> {
    try {
      const document = await this.documentRepository.findByHash(hash);

      return document;
    } catch (error) {
      this.logger.warn(`Postgres indisponível, consultando Fabric: ${error.message}`);
      return null;
    }
  }

  private async validateHashOnBlockchain(): Promise<ValidateDocumentResponseDto> {
    this.logger.warn('Validação com hash fornecido. Blockchain não pode ser consultado sem o arquivo original.');

    return {
      isValid: false,
      message: 'Documento não encontrado no sistema. Para validar via blockchain, forneça o arquivo PDF original.',
    };
  }

  private async validateOnBlockchain(
    fileBuffer: Buffer,
    hash: string,
    currentUser: ICurrentUser
  ): Promise<ValidateDocumentResponseDto> {
    try {
      const cid = await this.ipfsService.calculateCid(fileBuffer);

      const fabricUser: FabricUser = {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      };

      const fabricResult = await this.fabricService.verifyDocument(fabricUser, cid);

      if (fabricResult.valid && fabricResult.document) {
        return {
          isValid: true,
          document: {
            id: fabricResult.document.documentId,
            documentHash: hash,
            documentCid: cid,
            status: DocumentStatus.APPROVED,
          },
          message: 'Documento válido e registrado na blockchain',
        };
      }

    } catch (error) {
      this.logger.error(`Falha ao verificar no Fabric: ${error.message}`);
    }

    return {
      isValid: false,
      message: 'Documento não encontrado no sistema',
    };
  }

  private validateDocumentStatus(document: Document): ValidateDocumentResponseDto {
    if (document.isInactive()) {
      return {
        isValid: false,
        document: this.toSimpleDto(document),
        message: 'Documento foi inativado',
      };
    }

    if (!document.isApproved()) {
      return {
        isValid: false,
        document: this.toSimpleDto(document),
        message: 'Documento ainda não foi aprovado',
      };
    }

    return {
      isValid: true,
      document: this.toSimpleDto(document),
      message: 'Documento válido e registrado na blockchain',
    };
  }
}
