import { Injectable, Inject } from '@nestjs/common';
import { IApprovalRepository, APPROVAL_REPOSITORY, GroupedDocumentApprovals } from '../ports';
import { ApprovalStatus } from '../../domain/entities';
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
    let approvals: GroupedDocumentApprovals[];

    if (request.userRole === 'COORDINATOR') {
      // Coordinator sees only documents from their course
      const coordinator = await this.coordinatorRepository.findByUserId(request.userId);
      if (!coordinator || !coordinator.courseId) {
        return { approvals: [] };
      }

      if (request.status) {
        approvals = await this.approvalRepository.findGroupedByCourseIdAndStatus(coordinator.courseId, request.status);
      } else {
        approvals = await this.approvalRepository.findGroupedByCourseId(coordinator.courseId);
      }
    } else if (request.userRole === 'ADMIN') {
      // Admin sees all documents
      if (request.status) {
        approvals = await this.approvalRepository.findGroupedByStatus(request.status);
      } else {
        approvals = await this.approvalRepository.findAllGrouped();
      }
    } else {
      // Advisor and Student see only their own documents
      if (request.status) {
        approvals = await this.approvalRepository.findGroupedByUserIdAndStatus(request.userId, request.status);
      } else {
        approvals = await this.approvalRepository.findGroupedByUserId(request.userId);
      }
    }

    return { approvals };
  }
}
