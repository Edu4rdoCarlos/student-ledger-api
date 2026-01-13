import { Approval } from '../../domain/entities';
import { ApprovalResponseDto, PendingApprovalResponseDto, GroupedApprovalResponseDto } from '../dtos/response';
import { ApprovalWithDetails, GroupedDocumentApprovals } from '../../application/ports';
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

  static toDtoList(approvals: Approval[]): ApprovalResponseDto[] {
    return approvals.map(this.toDto);
  }

  static toHttpResponse(approval: Approval): HttpResponse<ApprovalResponseDto> {
    return HttpResponseSerializer.serialize(this.toDto(approval));
  }

  static toHttpResponseList(approvals: Approval[]): HttpResponse<ApprovalResponseDto[]> {
    return HttpResponseSerializer.serialize(this.toDtoList(approvals));
  }

  static toPendingApprovalDto(approvalWithDetails: ApprovalWithDetails): PendingApprovalResponseDto {
    return {
      id: approvalWithDetails.approval.id!,
      role: approvalWithDetails.approval.role,
      status: approvalWithDetails.approval.status,
      createdAt: approvalWithDetails.approval.createdAt!,
      documentId: approvalWithDetails.approval.documentId,
      documentTitle: approvalWithDetails.documentTitle,
      students: approvalWithDetails.students,
      courseName: approvalWithDetails.courseName,
      signatures: approvalWithDetails.allSignatures,
      approverId: approvalWithDetails.approval.approverId,
    };
  }

  static toPendingApprovalDtoList(approvalsWithDetails: ApprovalWithDetails[]): PendingApprovalResponseDto[] {
    return approvalsWithDetails.map(this.toPendingApprovalDto);
  }

  static toHttpResponsePendingList(approvalsWithDetails: ApprovalWithDetails[]): HttpResponse<PendingApprovalResponseDto[]> {
    return HttpResponseSerializer.serialize(this.toPendingApprovalDtoList(approvalsWithDetails));
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
      approved: approvals.filter((a) => a.status === 'APPROVED').length,
      pending: approvals.filter((a) => a.status === 'PENDING').length,
      rejected: approvals.filter((a) => a.status === 'REJECTED').length,
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

  static toGroupedApprovalDtoList(groupedList: GroupedDocumentApprovals[]): GroupedApprovalResponseDto[] {
    return groupedList.map(this.toGroupedApprovalDto);
  }

  static toHttpResponseGroupedList(groupedList: GroupedDocumentApprovals[]): HttpResponse<GroupedApprovalResponseDto[]> {
    return HttpResponseSerializer.serialize(this.toGroupedApprovalDtoList(groupedList));
  }
}
