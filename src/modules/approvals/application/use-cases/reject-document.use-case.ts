import { Injectable, Inject, Logger } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval } from '../../domain/entities';
import {
  ApprovalNotFoundError,
  ApprovalAlreadyProcessedError,
  MissingJustificationError,
} from '../../domain/errors';

interface RejectDocumentRequest {
  approvalId: string;
  userId: string;
  justification: string;
}

interface RejectDocumentResponse {
  approval: Approval;
}

@Injectable()
export class RejectDocumentUseCase {
  private readonly logger = new Logger(RejectDocumentUseCase.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
  ) {}

  async execute(request: RejectDocumentRequest): Promise<RejectDocumentResponse> {
    const approval = await this.approvalRepository.findById(request.approvalId);

    if (!approval) {
      throw new ApprovalNotFoundError();
    }

    if (approval.status !== 'PENDING') {
      throw new ApprovalAlreadyProcessedError();
    }

    if (!request.justification || request.justification.trim().length === 0) {
      throw new MissingJustificationError();
    }

    approval.reject(request.userId, request.justification);

    const updatedApproval = await this.approvalRepository.update(approval);

    return { approval: updatedApproval };
  }
}
