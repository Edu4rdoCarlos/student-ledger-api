import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { DocumentType, DocumentStatus, Document } from '../../domain/entities';
import { ValidateDocumentResponseDto, DefenseInfoDto } from '../../presentation/dtos';
import { FabricService } from '../../../../toolkit/fabric/fabric.service';
import { FabricUser, VerifyDocumentResult } from '../../../../toolkit/fabric/application/ports';
import { IpfsService } from '../../../../toolkit/ipfs';
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

  async execute(
    fileBuffer: Buffer,
    currentUser: ICurrentUser
  ): Promise<ValidateDocumentResponseDto> {
    if (!Buffer.isBuffer(fileBuffer)) {
      return this.buildNotFoundResponse();
    }

    const cid = await this.ipfsService.calculateCid(fileBuffer);
    const localDocument = await this.documentRepository.findByCid(cid);

    if (!localDocument) {
      return this.buildNotFoundResponse();
    }

    const defenseInfo = await this.getDefenseInfo(localDocument.defenseId);
    const documentType = this.determineDocumentType(localDocument, cid);

    if (localDocument.status === DocumentStatus.INACTIVE) {
      return this.buildInactiveResponse(localDocument, documentType, defenseInfo);
    }

    return this.verifyInBlockchain(localDocument, documentType, defenseInfo, currentUser);
  }

  private async getDefenseInfo(defenseId: string): Promise<DefenseInfoDto | undefined> {
    const defense = await this.defenseRepository.findById(defenseId);
    if (!defense) return undefined;

    return {
      students: defense.students?.map(s => s.name) ?? [],
      advisor: defense.advisor?.name ?? '',
      course: defense.students?.[0]?.course?.name ?? '',
    };
  }

  private determineDocumentType(document: Document, cid: string): DocumentType {
    return document.minutesCid === cid ? DocumentType.MINUTES : DocumentType.EVALUATION;
  }

  private buildNotFoundResponse(): ValidateDocumentResponseDto {
    return {
      isValid: false,
      status: 'NOT_FOUND',
    };
  }

  private buildInactiveResponse(
    document: Document,
    documentType: DocumentType,
    defenseInfo?: DefenseInfoDto
  ): ValidateDocumentResponseDto {
    return {
      isValid: false,
      status: DocumentStatus.INACTIVE,
      document: {
        id: document.id,
        documentType,
        minutesHash: document.minutesHash,
        minutesCid: document.minutesCid,
        evaluationHash: document.evaluationHash,
        evaluationCid: document.evaluationCid,
        status: DocumentStatus.INACTIVE,
        defenseInfo,
      },
    };
  }

  private buildPendingResponse(
    document: Document,
    documentType: DocumentType,
    defenseInfo?: DefenseInfoDto
  ): ValidateDocumentResponseDto {
    return {
      isValid: false,
      status: 'PENDING',
      document: {
        id: document.id,
        documentType,
        minutesHash: document.minutesHash,
        minutesCid: document.minutesCid,
        evaluationHash: document.evaluationHash,
        evaluationCid: document.evaluationCid,
        status: document.status,
        defenseInfo,
      },
    };
  }

  private buildApprovedResponse(
    fabricResult: VerifyDocumentResult,
    defenseInfo?: DefenseInfoDto
  ): ValidateDocumentResponseDto {
    const doc = fabricResult.document!;
    return {
      isValid: true,
      status: DocumentStatus.APPROVED,
      document: {
        id: doc.documentId,
        documentType: fabricResult.documentType as DocumentType,
        minutesHash: doc.minutesHash,
        minutesCid: doc.minutesCid,
        evaluationHash: doc.evaluationHash,
        evaluationCid: doc.evaluationCid,
        status: DocumentStatus.APPROVED,
        defenseInfo,
        blockchainData: {
          matriculas: doc.matriculas,
          defenseDate: doc.defenseDate,
          notaFinal: doc.notaFinal,
          resultado: doc.resultado,
          versao: doc.versao,
          signatures: doc.signatures,
          validatedAt: doc.validatedAt,
        },
      },
    };
  }

  private async verifyInBlockchain(
    localDocument: Document,
    documentType: DocumentType,
    defenseInfo: DefenseInfoDto | undefined,
    currentUser: ICurrentUser
  ): Promise<ValidateDocumentResponseDto> {
    const fabricUser: FabricUser = {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
    };

    try {
      const cid = localDocument.minutesCid || localDocument.evaluationCid;
      if (!cid) {
        return this.buildPendingResponse(localDocument, documentType, defenseInfo);
      }
      const fabricResult = await this.fabricService.verifyDocument(fabricUser, cid);

      if (fabricResult.valid && fabricResult.document && fabricResult.documentType) {
        return this.buildApprovedResponse(fabricResult, defenseInfo);
      }

      return this.buildPendingResponse(localDocument, documentType, defenseInfo);
    } catch (error) {
      this.logger.error(`Falha ao verificar na blockchain: ${error.message}`);
      return this.buildPendingResponse(localDocument, documentType, defenseInfo);
    }
  }
}
