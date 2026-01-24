import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { ValidateDocumentResponseDto, DefenseInfoDto } from '../../presentation/dtos';
import { HashUtil } from '../../infra/utils/hash.util';
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

  async execute(
    fileBuffer: Buffer,
    currentUser: ICurrentUser
  ): Promise<ValidateDocumentResponseDto> {
    if (!Buffer.isBuffer(fileBuffer)) {
      return {
        isValid: false,
        message: 'Para validar a autenticidade, é necessário fornecer o arquivo PDF original.',
      };
    }

    const hash = this.hashUtil.calculateSha256(fileBuffer);
    const cid = await this.ipfsService.calculateCid(fileBuffer);

    const fabricUser: FabricUser = {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
    };

    try {
      const fabricResult = await this.fabricService.verifyDocument(fabricUser, cid);

      if (fabricResult.valid && fabricResult.document) {
        const defenseInfo = await this.getSupplementaryInfo(cid);

        return {
          isValid: true,
          document: {
            id: fabricResult.document.documentId,
            documentHash: hash,
            documentCid: cid,
            status: 'APPROVED',
            defenseInfo,
            blockchainData: {
              matriculas: fabricResult.document.matriculas,
              defenseDate: fabricResult.document.defenseDate,
              notaFinal: fabricResult.document.notaFinal,
              resultado: fabricResult.document.resultado,
              versao: fabricResult.document.versao,
              signatures: fabricResult.document.signatures,
              validatedAt: fabricResult.document.validatedAt,
            },
          },
          message: 'Documento válido e registrado na blockchain',
        };
      }

      return {
        isValid: false,
        message: fabricResult.reason || 'Documento não encontrado na blockchain',
      };
    } catch (error) {
      this.logger.error(`Falha ao verificar na blockchain: ${error.message}`);

      return {
        isValid: false,
        message: 'Não foi possível verificar o documento na blockchain. Tente novamente mais tarde.',
      };
    }
  }

  private async getSupplementaryInfo(cid: string): Promise<DefenseInfoDto | undefined> {
    const localDocument = await this.documentRepository.findByCid(cid);
    if (!localDocument) return undefined;

    return this.getDefenseInfo(localDocument.defenseId);
  }
}
