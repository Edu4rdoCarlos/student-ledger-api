import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Role, DefenseResult } from '@prisma/client';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { IpfsService } from '../../../../toolkit/ipfs/ipfs.service';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { ICurrentUser } from '../../../../../shared/types';
import { DocumentType, Document } from '../../domain/entities';

interface DownloadDocumentResponse {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

@Injectable()
export class DownloadDocumentUseCase {
  private readonly logger = new Logger(DownloadDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    private readonly ipfsService: IpfsService,
  ) {}

  async execute(
    documentId: string,
    currentUser: ICurrentUser,
    documentType?: DocumentType,
  ): Promise<DownloadDocumentResponse> {
    const document = await this.findAndValidateDocument(documentId);
    await this.validateUserAccess(document, currentUser);
    const { cid, filename } = this.prepareCidAndFilename(document, documentType);

    return this.downloadFromIpfs(cid, filename);
  }

  private async findAndValidateDocument(documentId: string) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }
    return document;
  }

  private async validateUserAccess(document: Document, currentUser: ICurrentUser): Promise<void> {
    const isAdmin = currentUser.role === Role.ADMIN;

    if (isAdmin) {
      this.logger.log(`[DOWNLOAD] Usuário é ADMIN - acesso liberado`);
      return;
    }

    const isCoordinator = currentUser.role === Role.COORDINATOR;

    if (isCoordinator) {
      await this.validateCoordinatorAccess(document, currentUser);
      return;
    }

    await this.validateAdvisorOrStudentAccess(document, currentUser);
  }

  private async validateCoordinatorAccess(document: Document, currentUser: ICurrentUser): Promise<void> {
    if (!currentUser.courseId) {
      this.logger.warn(`[DOWNLOAD] Coordenador sem curso associado: ${currentUser.id}`);
      throw new ForbiddenException('Coordenador não está associado a nenhum curso');
    }

    const defenseCourseId = await this.defenseRepository.getDefenseCourseId(document.defenseId);
    if (defenseCourseId !== currentUser.courseId) {
      this.logger.warn(`[DOWNLOAD] Coordenador tentou acessar documento de outro curso`);
      throw new ForbiddenException('Coordenador só pode baixar documentos de defesas do seu curso');
    }
  }

  private async validateAdvisorOrStudentAccess(document: Document, currentUser: ICurrentUser): Promise<void> {
    const defense = await this.defenseRepository.findById(document.defenseId);

    if (!defense) {
      this.logger.warn(`[DOWNLOAD] Defesa não encontrada: ${document.defenseId}`);
      throw new NotFoundException('Defesa associada ao documento não encontrada');
    }

    const isAdvisor = defense.advisorId === currentUser.id;
    const isStudent = defense.studentIds.includes(currentUser.id);

    if (!isAdvisor && !isStudent) {
      this.logger.warn(`[DOWNLOAD] Usuário ${currentUser.id} não é advisor nem student da defesa`);
      throw new ForbiddenException('Você não tem permissão para baixar este documento');
    }

    if (defense.result !== DefenseResult.APPROVED) {
      this.logger.warn(`[DOWNLOAD] Defesa não aprovada. Status atual: ${defense.result}`);
      throw new ForbiddenException('O documento só pode ser baixado quando a defesa estiver aprovada');
    }
  }

  private prepareCidAndFilename(document: Document, documentType?: DocumentType) {
    let cid: string | undefined;
    let filenamePrefix: string;

    if (documentType === 'minutes') {
      cid = document.minutesCid;
      filenamePrefix = 'ata';
    } else if (documentType === 'evaluation') {
      cid = document.evaluationCid;
      filenamePrefix = 'avaliacao';
    } else {
      cid = document.minutesCid;
      filenamePrefix = 'ata';
    }

    const filename = `${filenamePrefix}-${document.id}.pdf`;

    if (!cid) {
      const docTypeLabel = documentType === 'minutes' ? 'Ata' : documentType === 'evaluation' ? 'Avaliação de Desempenho' : 'Documento';
      this.logger.error(`[DOWNLOAD] Documento ${document.id} não possui CID do IPFS para ${docTypeLabel}!`);
      throw new NotFoundException(`${docTypeLabel} não possui CID do IPFS`);
    }

    return { cid, filename };
  }

  private async downloadFromIpfs(cid: string, filename: string): Promise<DownloadDocumentResponse> {
    try {
      const buffer = await this.ipfsService.downloadFile(cid);
      return {
        buffer,
        filename,
        mimeType: 'application/pdf',
      };
    } catch (error) {
      this.logger.error(`[DOWNLOAD] Falha ao baixar do IPFS - CID: ${cid}, Erro: ${error.message}`, error.stack);
      throw new NotFoundException('Documento não disponível no IPFS');
    }
  }
}
