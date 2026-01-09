import { Approval } from '../../domain/entities';
import { ApprovalResponseDto } from '../dtos/response';
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
}
