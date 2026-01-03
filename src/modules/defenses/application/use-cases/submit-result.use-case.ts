import { Injectable, Inject } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import {
  Document,
  DocumentType
} from '../../../documents/domain/entities';
import {
  IDocumentRepository,
  DOCUMENT_REPOSITORY
} from '../../../documents/application/ports';
import { IpfsService } from '../../../ipfs/ipfs.service';

interface SubmitDefenseResultRequest {
  id: string;
  finalGrade: number;
  documentFile: Buffer;
  documentFilename: string;
}

interface SubmitDefenseResultResponse {
  defense: Defense;
  document: Document;
}

@Injectable()
export class SubmitDefenseResultUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly ipfsService: IpfsService,
  ) {}

  async execute(request: SubmitDefenseResultRequest): Promise<SubmitDefenseResultResponse> {
    const defense = await this.defenseRepository.findById(request.id);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    // 1. Upload file to IPFS
    const ipfsResult = await this.ipfsService.uploadFile(
      request.documentFile,
      request.documentFilename
    );

    // Check if upload was queued (IPFS offline)
    if ('queued' in ipfsResult) {
      throw new Error('Documento foi enfileirado para upload. IPFS temporariamente indisponível');
    }

    // 2. Set the grade on the defense
    defense.setGrade(request.finalGrade);

    // 3. Create the unified defense document with IPFS CID as hash
    // The IPFS CID serves as both the content identifier and the document hash
    const document = Document.create({
      tipo: DocumentType.ATA,
      documentoHash: ipfsResult.cid,  // CID is the content-addressed hash
      arquivoPath: `ipfs://${ipfsResult.cid}`,
      defenseId: request.id,
    });

    // 4. Save both in parallel
    const [updatedDefense, createdDocument] = await Promise.all([
      this.defenseRepository.update(defense),
      this.documentRepository.create(document),
    ]);

    return {
      defense: updatedDefense,
      document: createdDocument,
    };
  }
}
