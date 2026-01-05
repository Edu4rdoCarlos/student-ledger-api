import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { MongoStorageService } from '../../../../database/mongo';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';

interface DownloadDocumentResponse {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

interface CurrentUser {
  id: string;
  role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';
}

@Injectable()
export class DownloadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    private readonly mongoStorage: MongoStorageService,
    private readonly ipfsService: IpfsService,
  ) {}

  async execute(documentId: string, currentUser: CurrentUser): Promise<DownloadDocumentResponse> {
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

    // Try MongoDB first (GridFS) if mongoFileId exists
    if (document.mongoFileId) {
      try {
        const buffer = await this.mongoStorage.downloadFile(document.mongoFileId);
        return {
          buffer,
          filename,
          mimeType: 'application/pdf',
        };
      } catch (mongoError) {
        // Continue to IPFS fallback
      }
    }

    // Fallback to IPFS using documentHash (CID)
    if (document.documentHash) {
      try {
        const buffer = await this.ipfsService.downloadFile(document.documentHash);

        return {
          buffer,
          filename,
          mimeType: 'application/pdf',
        };
      } catch (ipfsError) {
        throw new NotFoundException('Documento não disponível no MongoDB nem no IPFS');
      }
    }

    throw new NotFoundException('Documento não possui hash IPFS nem arquivo no MongoDB');
  }
}
