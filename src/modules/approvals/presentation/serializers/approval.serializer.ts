import { Approval, ApprovalStatus } from '../../domain/entities';
import { ApprovalResponseDto, GroupedApprovalResponseDto } from '../dtos/response';
import { GroupedDocumentApprovals } from '../../application/ports';
import { HttpResponse } from '../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../shared/serializers';

export class ApprovalSerializer {
  static toDto(approval: Approval): ApprovalResponseDto {
    return {
      id: approval.id!,
      role: approval.role,
      status: approval.status,
      justification: approval.justification,
      approvedAt: approval.approvedAt,
      createdAt: approval.createdAt!,
      updatedAt: approval.updatedAt!,
      documentId: approval.documentId,
      approverId: approval.approverId,
    };
  }

  static toHttpResponse(approval: Approval): HttpResponse<ApprovalResponseDto> {
    return HttpResponseSerializer.serialize(this.toDto(approval));
  }

  static toGroupedApprovalDto(grouped: GroupedDocumentApprovals): GroupedApprovalResponseDto {
    const approvals = grouped.approvals.map((approval) => ({
      id: approval.id,
      role: approval.role,
      status: approval.status,
      approverName: approval.approverName,
      approvedAt: approval.approvedAt,
      justification: approval.justification,
      approverId: approval.approverId,
    }));

    const summary = {
      total: approvals.length,
      approved: approvals.filter((a) => a.status === ApprovalStatus.APPROVED).length,
      pending: approvals.filter((a) => a.status === ApprovalStatus.PENDING).length,
      rejected: approvals.filter((a) => a.status === ApprovalStatus.REJECTED).length,
    };

    return {
      documentId: grouped.documentId,
      documentTitle: grouped.documentTitle,
      students: grouped.students,
      courseName: grouped.courseName,
      createdAt: grouped.createdAt,
      approvals,
      summary,
    };
  }

  static toHttpResponseGroupedList(groupedList: GroupedDocumentApprovals[]): HttpResponse<GroupedApprovalResponseDto[]> {
    return HttpResponseSerializer.serialize(groupedList.map(this.toGroupedApprovalDto));
  }
}
