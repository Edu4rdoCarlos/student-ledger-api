import { Injectable, Inject, ForbiddenException, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import { Document } from '../../../documents/domain/entities';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../../../documents/application/ports';
import { NotifyDefenseResultUseCase } from './notify-defense-result.use-case';
import { CreateApprovalsUseCase } from '../../../approvals/application/use-cases';
import { ICurrentUser } from '../../../../../shared/types';
import { FileUploadAdapter } from '../../../../../shared/adapters';

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
    private readonly fileUploadAdapter: FileUploadAdapter,
    private readonly notifyDefenseResultUseCase: NotifyDefenseResultUseCase,
    private readonly createApprovalsUseCase: CreateApprovalsUseCase,
  ) {}

  async execute(request: SubmitDefenseResultRequest): Promise<SubmitDefenseResultResponse> {
    const defense = await this.findAndValidateDefense(request.id, request.currentUser);

    const [minutesUpload, evaluationUpload] = await this.uploadFiles(request);

    const document = Document.create({
      minutesHash: minutesUpload.hash,
      minutesCid: minutesUpload.cid,
      evaluationHash: evaluationUpload.hash,
      evaluationCid: evaluationUpload.cid,
      defenseId: request.id,
    });

    const createdDocument = await this.documentRepository.create(document);

    defense.setGrade(request.finalGrade);
    const updatedDefense = await this.defenseRepository.update(defense);

    this.sendNotifications(request.id, createdDocument.id, request.currentUser!.id);

    return {
      defense: updatedDefense,
      document: createdDocument,
    };
  }

  private async findAndValidateDefense(defenseId: string, currentUser?: ICurrentUser): Promise<Defense> {
    const defense = await this.defenseRepository.findById(defenseId);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    if (!defense.isScheduled()) {
      throw new ForbiddenException('Só é possível submeter documentos para defesas agendadas');
    }

    const now = new Date();
    if (now < defense.defenseDate) {
      throw new ForbiddenException('Só é possível submeter resultados após a data da defesa');
    }

    if (currentUser?.role === Role.COORDINATOR) {
      await this.validateCoordinatorAccess(defenseId, currentUser.courseId);
    }

    return defense;
  }

  private async validateCoordinatorAccess(defenseId: string, courseId?: string): Promise<void> {
    if (!courseId) {
      throw new ForbiddenException('Coordenador não está associado a nenhum curso');
    }

    const defenseCourseId = await this.defenseRepository.getDefenseCourseId(defenseId);
    if (defenseCourseId !== courseId) {
      throw new ForbiddenException('Coordenador só pode submeter resultados de defesas do seu curso');
    }
  }

  private async uploadFiles(request: SubmitDefenseResultRequest) {
    return this.fileUploadAdapter.uploadMultipleFiles([
      { buffer: request.minutesFile, filename: request.minutesFilename },
      { buffer: request.evaluationFile, filename: request.evaluationFilename },
    ]);
  }

  private sendNotifications(defenseId: string, documentId: string, coordinatorId: string): void {
    this.notifyDefenseResultUseCase.execute(defenseId).catch((error) => {
      this.logger.error(`Falha ao enviar notificação: ${error.message}`);
    });

    this.createApprovalsUseCase.execute({
      documentId,
      coordinatorId,
    }).catch((error) => {
      this.logger.error(`Falha ao criar aprovações: ${error.message}`);
    });
  }
}
