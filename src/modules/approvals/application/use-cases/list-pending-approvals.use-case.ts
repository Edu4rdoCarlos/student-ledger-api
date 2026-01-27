import { Injectable, Inject } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY, GroupedDocumentApprovals } from '../ports';
import { ApprovalStatus } from '../../domain/entities';
import { calculateConsolidatedStatus } from '../../domain/helpers';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { Role } from '@prisma/client';

interface ListPendingApprovalsRequest {
  userId: string;
  userRole: string;
  status?: ApprovalStatus;
}

interface ListPendingApprovalsResponse {
  approvals: GroupedDocumentApprovals[];
}

@Injectable()
export class ListPendingApprovalsUseCase {
  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
  ) {}

  async execute(request: ListPendingApprovalsRequest): Promise<ListPendingApprovalsResponse> {
    let approvals: GroupedDocumentApprovals[];

    if (request.userRole === Role.COORDINATOR) {
      const coordinator = await this.coordinatorRepository.findByUserId(request.userId);
      if (!coordinator || !coordinator.courseId) {
        return { approvals: [] };
      }
      approvals = await this.approvalRepository.findGroupedByCourseId(coordinator.courseId);
    } else if (request.userRole === Role.ADMIN) {
      approvals = await this.approvalRepository.findAllGrouped();
    } else {
      approvals = await this.approvalRepository.findGroupedByParticipant(request.userId);
    }

    if (request.status) {
      approvals = approvals.filter((doc) => {
        const consolidatedStatus = calculateConsolidatedStatus(doc.approvals);
        return consolidatedStatus === request.status;
      });
    }

    return { approvals };
  }
}
