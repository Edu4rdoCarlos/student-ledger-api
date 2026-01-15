import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { ValidateDocumentResponseDto, SimpleDocumentDto, DefenseInfoDto } from '../../presentation/dtos';
import { HashUtil } from '../../infra/utils/hash.util';
import { Document } from '../../domain/entities';
import { FabricService } from '../../../fabric/fabric.service';
import { FabricUser } from '../../../fabric/application/ports';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { ICurrentUser } from '../../../../shared/types';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';

@Injectable()
export class ValidateDocumentUseCase {
  private readonly logger = new Logger(ValidateDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    private readonly hashUtil: HashUtil,
    private readonly fabricService: FabricService,
    private readonly ipfsService: IpfsService,
  ) {}

  private async getDefenseInfo(defenseId: string): Promise<DefenseInfoDto | undefined> {
    const defense = await this.defenseRepository.findById(defenseId);
    if (!defense) return undefined;

    return {
      students: defense.students?.map(s => s.name) ?? [],
      advisor: defense.advisor?.name ?? '',
      course: defense.students?.[0]?.course?.name ?? '',
    };
  }

  private async toSimpleDto(document: Document): Promise<SimpleDocumentDto> {
    const defenseInfo = await this.getDefenseInfo(document.defenseId);

    return {
      id: document.id,
      documentHash: document.documentHash,
      documentCid: document.documentCid,
      status: document.status,
      defenseInfo,
    };
  }

  async execute(
    fileBufferOrHash: Buffer | string,
    currentUser: ICurrentUser
  ): Promise<ValidateDocumentResponseDto> {
    const isBuffer = Buffer.isBuffer(fileBufferOrHash);
    const hash = isBuffer
      ? this.hashUtil.calculateSha256(fileBufferOrHash)
      : fileBufferOrHash;

    const document = await this.documentRepository.findByHash(hash);

    if (document) {
      return this.validateDocumentStatus(document);
    }

    if (isBuffer) {
      return this.validateOnBlockchain(fileBufferOrHash, hash, currentUser);
    }

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
        const localDocument = await this.documentRepository.findByCid(cid);
        const defenseInfo = localDocument
          ? await this.getDefenseInfo(localDocument.defenseId)
          : undefined;

        return {
          isValid: true,
          document: {
            id: fabricResult.document.documentId,
            documentHash: hash,
            documentCid: cid,
            status: 'APPROVED',
            defenseInfo,
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

  private async validateDocumentStatus(document: Document): Promise<ValidateDocumentResponseDto> {
    if (document.isInactive()) {
      return {
        isValid: false,
        document: await this.toSimpleDto(document),
        message: 'Documento foi inativado',
      };
    }

    if (!document.isApproved()) {
      return {
        isValid: false,
        document: await this.toSimpleDto(document),
        message: 'Documento ainda não foi aprovado',
      };
    }

    return {
      isValid: true,
      document: await this.toSimpleDto(document),
      message: 'Documento válido e registrado na blockchain',
    };
  }
}
