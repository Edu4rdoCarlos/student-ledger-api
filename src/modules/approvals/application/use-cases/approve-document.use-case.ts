import { Injectable, Inject, Logger, forwardRef } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval } from '../../domain/entities';
import {
  ApprovalNotFoundError,
  ApprovalAlreadyProcessedError,
} from '../../domain/errors';
import { RegisterOnBlockchainUseCase } from './register-on-blockchain.use-case';

interface ApproveDocumentRequest {
  approvalId: string;
  userId: string;
}

interface ApproveDocumentResponse {
  approval: Approval;
}

@Injectable()
export class ApproveDocumentUseCase {
  private readonly logger = new Logger(ApproveDocumentUseCase.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
    @Inject(forwardRef(() => RegisterOnBlockchainUseCase))
    private readonly registerOnBlockchainUseCase: RegisterOnBlockchainUseCase,
  ) {}

  async execute(request: ApproveDocumentRequest): Promise<ApproveDocumentResponse> {
    const approval = await this.approvalRepository.findById(request.approvalId);

    if (!approval) {
      throw new ApprovalNotFoundError();
    }

    if (approval.status !== 'PENDING') {
      throw new ApprovalAlreadyProcessedError();
    }

    approval.approve(request.userId);

    const updatedApproval = await this.approvalRepository.update(approval);

    this.logger.log(`Aprovação ${approval.id} processada por ${request.userId}`);

    this.registerOnBlockchainUseCase.execute({ documentId: approval.documentId }).catch((error) => {
      this.logger.error(`Failed to register on blockchain: ${error.message}`);
    });

    return { approval: updatedApproval };
  }
}
