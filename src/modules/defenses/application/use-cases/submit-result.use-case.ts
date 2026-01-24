import { Injectable, Inject, InternalServerErrorException, ForbiddenException, Logger } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import {
  Document,
} from '../../../documents/domain/entities';
import {
  IDocumentRepository,
  DOCUMENT_REPOSITORY
} from '../../../documents/application/ports';
import { HashUtil } from '../../../documents/infra/utils/hash.util';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { NotifyDefenseResultUseCase } from './notify-defense-result.use-case';
import { CreateApprovalsUseCase } from '../../../approvals/application/use-cases';
import { ICurrentUser } from '../../../../shared/types';

interface SubmitDefenseResultRequest {
  id: string;
  finalGrade: number;
  minutesFile: Buffer;
  minutesFilename: string;
  evaluationFile: Buffer;
  evaluationFilename: string;
  currentUser?: ICurrentUser;
}

interface SubmitDefenseResultResponse {
  defense: Defense;
  document: Document;
}

@Injectable()
export class SubmitDefenseResultUseCase {
  private readonly logger = new Logger(SubmitDefenseResultUseCase.name);

  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly hashUtil: HashUtil,
    private readonly ipfsService: IpfsService,
    private readonly notifyDefenseResultUseCase: NotifyDefenseResultUseCase,
    private readonly createApprovalsUseCase: CreateApprovalsUseCase,
  ) {}

  async execute(request: SubmitDefenseResultRequest): Promise<SubmitDefenseResultResponse> {
    const defense = await this.defenseRepository.findById(request.id);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    if (defense.status !== 'SCHEDULED') {
      throw new ForbiddenException('Só é possível submeter documentos para defesas agendadas');
    }

    const now = new Date();
    if (now < defense.defenseDate) {
      throw new ForbiddenException('Só é possível submeter resultados após a data da defesa');
    }

    if (request.currentUser?.role === 'COORDINATOR') {
      if (!request.currentUser.courseId) {
        throw new ForbiddenException('Coordenador não está associado a nenhum curso');
      }

      const defenseCourseId = await this.defenseRepository.getDefenseCourseId(request.id);
      if (defenseCourseId !== request.currentUser.courseId) {
        throw new ForbiddenException('Coordenador só pode submeter resultados de defesas do seu curso');
      }
    }

    // Calculate hashes for both files
    const minutesHash = this.hashUtil.calculateSha256(request.minutesFile);
    const evaluationHash = this.hashUtil.calculateSha256(request.evaluationFile);

    let minutesCid: string;
    let evaluationCid: string;

    try {
      // Upload minutes file (Ata) to IPFS
      const minutesIpfsResult = await this.ipfsService.uploadFile(
        request.minutesFile,
        request.minutesFilename
      );

      if ('queued' in minutesIpfsResult) {
        this.logger.warn('Upload IPFS da Ata enfileirado - será processado em breve');
        throw new InternalServerErrorException('Sistema de armazenamento temporariamente indisponível. Tente novamente em alguns minutos.');
      }

      minutesCid = minutesIpfsResult.cid;

      // Upload evaluation file (Avaliação de Desempenho) to IPFS
      const evaluationIpfsResult = await this.ipfsService.uploadFile(
        request.evaluationFile,
        request.evaluationFilename
      );

      if ('queued' in evaluationIpfsResult) {
        this.logger.warn('Upload IPFS da Avaliação enfileirado - será processado em breve');
        throw new InternalServerErrorException('Sistema de armazenamento temporariamente indisponível. Tente novamente em alguns minutos.');
      }

      evaluationCid = evaluationIpfsResult.cid;
    } catch (error) {
      this.logger.error(`Falha ao fazer upload para IPFS: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao fazer upload dos arquivos. Tente novamente.');
    }

    const document = Document.create({
      minutesHash,
      minutesCid,
      evaluationHash,
      evaluationCid,
      defenseId: request.id,
    });

    try {
      const createdDocument = await this.documentRepository.create(document);

      defense.setGrade(request.finalGrade);
      const updatedDefense = await this.defenseRepository.update(defense);

      this.notifyDefenseResultUseCase.execute(request.id).catch((error) => {
        this.logger.error(`Falha ao enviar notificação: ${error.message}`);
      });

      this.createApprovalsUseCase.execute({ documentId: createdDocument.id }).catch((error) => {
        this.logger.error(`Falha ao criar aprovações: ${error.message}`);
      });

      return {
        defense: updatedDefense,
        document: createdDocument,
      };
    } catch (error) {
      this.logger.error(`Falha ao criar documento/atualizar defesa: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao processar resultado da defesa. Tente novamente.');
    }
  }
}
