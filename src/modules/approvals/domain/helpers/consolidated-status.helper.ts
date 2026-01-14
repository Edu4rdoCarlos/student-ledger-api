import { ApprovalStatus } from '../entities';

interface ApprovalForStatus {
  status: ApprovalStatus;
}

/**
 * Calculates the consolidated status of a document based on its approvals.
 *
 * Rules:
 * - REJECTED: If ANY approval has status REJECTED
 * - PENDING: If there's no rejection AND at least one approval is PENDING
 * - APPROVED: ONLY if ALL approvals are APPROVED
 */
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
