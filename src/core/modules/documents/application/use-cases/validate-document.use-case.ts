import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { DocumentType } from '../../domain/entities';
import { ValidateDocumentResponseDto, DefenseInfoDto } from '../../presentation/dtos';
import { FabricService } from '../../../../toolkit/fabric/fabric.service';
import { FabricUser } from '../../../../toolkit/fabric/application/ports';
import { IpfsService } from '../../../../toolkit/ipfs/ipfs.service';
import { ICurrentUser } from '../../../../../shared/types';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';

@Injectable()
export class ValidateDocumentUseCase {
  private readonly logger = new Logger(ValidateDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
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
        status: 'NOT_FOUND',
      };
    }

    const cid = await this.ipfsService.calculateCid(fileBuffer);

    // 1. Verificar se o documento existe no banco local
    const localDocument = await this.documentRepository.findByCid(cid);

    if (!localDocument) {
      // Documento não existe no sistema - possível fraude
      return {
        isValid: false,
        status: 'NOT_FOUND',
      };
    }

    // Buscar informações da defesa
    const defenseInfo = await this.getDefenseInfo(localDocument.defenseId);

    // Determinar qual tipo de documento está sendo validado
    const documentType = localDocument.minutesCid === cid ? DocumentType.MINUTES : DocumentType.EVALUATION;

    // 2. Se documento está inativo
    if (localDocument.status === 'INACTIVE') {
      return {
        isValid: false,
        status: 'INACTIVE',
        document: {
          id: localDocument.id,
          documentType,
          minutesHash: localDocument.minutesHash,
          minutesCid: localDocument.minutesCid,
          evaluationHash: localDocument.evaluationHash,
          evaluationCid: localDocument.evaluationCid,
          status: 'INACTIVE',
          defenseInfo,
        },
      };
    }

    // 3. Verificar na blockchain
    const fabricUser: FabricUser = {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
    };

    try {
      const fabricResult = await this.fabricService.verifyDocument(fabricUser, cid);

      if (fabricResult.valid && fabricResult.document && fabricResult.documentType) {
        // Documento válido e registrado na blockchain
        return {
          isValid: true,
          status: 'APPROVED',
          document: {
            id: fabricResult.document.documentId,
            documentType: fabricResult.documentType as DocumentType,
            minutesHash: fabricResult.document.minutesHash,
            minutesCid: fabricResult.document.minutesCid,
            evaluationHash: fabricResult.document.evaluationHash,
            evaluationCid: fabricResult.document.evaluationCid,
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
        };
      }

      // Documento existe no banco mas não está na blockchain - pendente de aprovação
      return {
        isValid: false,
        status: 'PENDING',
        document: {
          id: localDocument.id,
          documentType,
          minutesHash: localDocument.minutesHash,
          minutesCid: localDocument.minutesCid,
          evaluationHash: localDocument.evaluationHash,
          evaluationCid: localDocument.evaluationCid,
          status: localDocument.status,
          defenseInfo,
        },
      };
    } catch (error) {
      this.logger.error(`Falha ao verificar na blockchain: ${error.message}`);

      // Em caso de erro, retornar como pendente já que existe no banco
      return {
        isValid: false,
        status: 'PENDING',
        document: {
          id: localDocument.id,
          documentType,
          minutesHash: localDocument.minutesHash,
          minutesCid: localDocument.minutesCid,
          evaluationHash: localDocument.evaluationHash,
          evaluationCid: localDocument.evaluationHash,
          status: localDocument.status,
          defenseInfo,
        },
      };
    }
  }
}
