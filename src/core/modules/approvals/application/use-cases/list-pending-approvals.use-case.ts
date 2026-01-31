import { Injectable, Inject } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IApprovalRepository, APPROVAL_REPOSITORY, GroupedDocumentApprovals } from '../ports';
import { ApprovalStatus } from '../../domain/entities';
import { calculateConsolidatedStatus } from '../../domain/helpers';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';

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
    const approvals = await this.fetchApprovalsByRole(request.userId, request.userRole);
    const filtered = this.filterByStatus(approvals, request.status);

    return { approvals: filtered };
  }

  private async fetchApprovalsByRole(userId: string, userRole: string): Promise<GroupedDocumentApprovals[]> {
    switch (userRole) {
      case Role.COORDINATOR:
        return this.fetchCoordinatorApprovals(userId);

      default:
        return this.approvalRepository.findGroupedByParticipant(userId);
    }
  }

  private async fetchCoordinatorApprovals(userId: string): Promise<GroupedDocumentApprovals[]> {
    const coordinator = await this.coordinatorRepository.findByUserId(userId);

    if (!coordinator?.courseId) {
      return [];
    }

    return this.approvalRepository.findGroupedByCourseId(coordinator.courseId);
  }

  private filterByStatus(
    approvals: GroupedDocumentApprovals[],
    status?: ApprovalStatus,
  ): GroupedDocumentApprovals[] {
    if (!status) {
      return approvals;
    }

    return approvals.filter(doc => {
      const consolidatedStatus = calculateConsolidatedStatus(doc.approvals);
      return consolidatedStatus === status;
    });
  }
}
