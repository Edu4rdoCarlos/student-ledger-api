import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { ICurrentUser } from '../../../../shared/types';

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

  async execute(documentId: string, currentUser: ICurrentUser): Promise<DownloadDocumentResponse> {
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    // Check permissions
    const isAdmin = currentUser.role === 'ADMIN';
    const isCoordinator = currentUser.role === 'COORDINATOR';

    if (!isAdmin && !isCoordinator) {
      // Need to check if user is a participant in the defense
      const defense = await this.defenseRepository.findById(document.defenseId);

      if (!defense) {
        throw new NotFoundException('Defesa associada ao documento não encontrada');
      }

      const isAdvisor = defense.advisorId === currentUser.id;
      const isStudent = defense.studentIds.includes(currentUser.id);

      if (!isAdvisor && !isStudent) {
        throw new ForbiddenException('Você não tem permissão para baixar este documento');
      }

      // Also check if defense is approved
      if (defense.result !== 'APPROVED') {
        throw new ForbiddenException('O documento só pode ser baixado quando a defesa estiver aprovada');
      }
    }

    const filename = `documento-${document.type}-${document.id}.pdf`;

    if (!document.documentCid) {
      throw new NotFoundException('Documento não possui CID do IPFS');
    }

    try {
      const buffer = await this.ipfsService.downloadFile(document.documentCid);
      this.logger.log(`Arquivo baixado do IPFS: ${document.documentCid}`);

      return {
        buffer,
        filename,
        mimeType: 'application/pdf',
      };
    } catch (error) {
      this.logger.error(`Falha ao baixar arquivo: ${error.message}`);
      throw new NotFoundException('Documento não disponível no IPFS');
    }
  }
}
