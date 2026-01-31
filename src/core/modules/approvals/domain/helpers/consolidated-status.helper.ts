import { ApprovalStatus } from '../entities';

interface ApprovalForStatus {
  status: ApprovalStatus;
}

export function calculateConsolidatedStatus(
  approvals: ApprovalForStatus[],
): ApprovalStatus {
  if (approvals.length === 0) {
    return ApprovalStatus.PENDING;
  }

  const hasRejected = approvals.some(
    (approval) => approval.status === ApprovalStatus.REJECTED,
  );

  if (hasRejected) {
    return ApprovalStatus.REJECTED;
  }

  const hasPending = approvals.some(
    (approval) => approval.status === ApprovalStatus.PENDING,
  );

  if (hasPending) {
    return ApprovalStatus.PENDING;
  }

  return ApprovalStatus.APPROVED;

}