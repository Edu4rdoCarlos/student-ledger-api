import { Injectable, Inject } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { Approval } from '../../domain/entities';

interface ListPendingApprovalsRequest {
  userId: string;
  userRole: string;
}

interface ListPendingApprovalsResponse {
  approvals: Approval[];
}

@Injectable()
export class ListPendingApprovalsUseCase {
  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
  ) {}

  async execute(request: ListPendingApprovalsRequest): Promise<ListPendingApprovalsResponse> {
    let approvals: Approval[];

    if (request.userRole === 'COORDINATOR' || request.userRole === 'ADMIN') {
      approvals = await this.approvalRepository.findAllPending();
    } else {
      approvals = await this.approvalRepository.findPendingByUserId(request.userId);
    }

    return { approvals };
  }
}
