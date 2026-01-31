import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval, ApprovalRole, ApprovalStatus } from '../../domain/entities';
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
  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
  ) {}

  async execute(request: RejectDocumentRequest): Promise<RejectDocumentResponse> {
    this.validateJustification(request.justification);

    const approval = await this.findAndValidateApproval(request.approvalId);

    approval.reject(request.userId, request.justification);
    const updatedApproval = await this.approvalRepository.update(approval);

    return { approval: updatedApproval };
  }

  private validateJustification(justification: string): void {
    if (!justification || justification.trim().length === 0) {
      throw new MissingJustificationError();
    }
  }

  private async findAndValidateApproval(approvalId: string): Promise<Approval> {
    const approval = await this.approvalRepository.findById(approvalId);

    if (!approval) {
      throw new ApprovalNotFoundError();
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new ApprovalAlreadyProcessedError();
    }

    if (approval.role === ApprovalRole.COORDINATOR) {
      throw new ForbiddenException(
        'Coordenadores não podem rejeitar documentos. Apenas orientadores e estudantes podem rejeitar.',
      );
    }

    return approval;
  }
}
