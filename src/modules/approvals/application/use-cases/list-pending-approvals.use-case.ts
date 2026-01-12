import { Injectable, Inject } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY, ApprovalWithDetails } from '../ports';

interface ListPendingApprovalsRequest {
  userId: string;
  userRole: string;
}

interface ListPendingApprovalsResponse {
  approvals: ApprovalWithDetails[];
}

@Injectable()
export class ListPendingApprovalsUseCase {
  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
  ) {}

  async execute(request: ListPendingApprovalsRequest): Promise<ListPendingApprovalsResponse> {
    let approvals: ApprovalWithDetails[];

    if (request.userRole === 'COORDINATOR' || request.userRole === 'ADMIN') {
      approvals = await this.approvalRepository.findAllPendingWithDetails();
    } else {
      approvals = await this.approvalRepository.findPendingByUserIdWithDetails(request.userId);
    }

    return { approvals };
  }
}
