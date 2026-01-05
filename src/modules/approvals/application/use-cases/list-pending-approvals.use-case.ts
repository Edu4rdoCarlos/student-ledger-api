import { Injectable, Inject, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ListPendingApprovalsUseCase.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
  ) {}

  async execute(request: ListPendingApprovalsRequest): Promise<ListPendingApprovalsResponse> {
    this.logger.log(`Listando aprovações pendentes para usuário ${request.userId} (${request.userRole})`);

    let approvals: Approval[];

    // COORDINATOR e ADMIN veem todas as aprovações pendentes
    if (request.userRole === 'COORDINATOR' || request.userRole === 'ADMIN') {
      approvals = await this.approvalRepository.findAllPending();
    } else {
      // ADVISOR e STUDENT veem apenas suas aprovações
      approvals = await this.approvalRepository.findPendingByUserId(request.userId);
    }

    this.logger.log(`Encontradas ${approvals.length} aprovações pendentes`);

    return { approvals };
  }
}
