import { Defense } from '../../domain/entities';
import { DefenseResponseDto, ListDefensesResponseDto, DefenseListItemDto } from '../dtos/response';
import { PaginationMetadata, HttpResponse } from '../../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../../shared/serializers';

interface CurrentUser {
  id: string;
  role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';
}

export class DefenseSerializer {
  static serialize(defense: Defense, currentUser: CurrentUser): DefenseResponseDto {
    const isAdmin = currentUser.role === 'ADMIN';
    const isCoordinator = currentUser.role === 'COORDINATOR';
    const isAdvisor = currentUser.role === 'ADVISOR';
    const isStudent = currentUser.role === 'STUDENT';

    const isDefenseParticipant =
      defense.advisor?.id === currentUser.id || defense.students?.some((s) => s.id === currentUser.id);

    const isApproved = defense.result === 'APPROVED';

    const hasFullAccess = isAdmin || isCoordinator || isDefenseParticipant;

    const showSensitiveData = hasFullAccess;
    const showFinalGrade = hasFullAccess || (isApproved && (isAdvisor || isStudent));
    const showDocuments = hasFullAccess || isApproved;

    const firstStudent = defense.students?.[0];
    const course = firstStudent?.course || { id: '', code: '', name: '' };

    return {
      id: defense.id,
      title: defense.title,
      defenseDate: defense.defenseDate,
      location: showSensitiveData ? defense.location : undefined,
      finalGrade: showFinalGrade ? defense.finalGrade : undefined,
      result: defense.result,
      status: defense.status,
      advisor: {
        id: defense.advisor?.id ?? '',
        name: defense.advisor?.name ?? '',
        email: showSensitiveData ? defense.advisor?.email : undefined,
        specialization: defense.advisor?.specialization,
        isActive: defense.advisor?.isActive ?? true,
      },
      students:
        defense.students?.map((s) => ({
          id: s.id,
          name: s.name,
          email: showSensitiveData ? s.email : undefined,
          registration: showSensitiveData ? s.registration : undefined,
          course: s.course,
        })) ?? [],
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
      },
      examBoard: showSensitiveData
        ? defense.examBoard?.map((member) => ({
            id: member.id!,
            name: member.name,
            email: member.email,
          }))
        : undefined,
      documents: showDocuments
        ? defense.documents?.map((d) => ({
            id: d.id,
            version: d.version,
            status: d.status,
            changeReason: d.changeReason,
            minutesCid: d.minutesCid,
            evaluationCid: d.evaluationCid,
            blockchainRegisteredAt: d.blockchainRegisteredAt,
            createdAt: d.createdAt,
            signatures: d.approvals?.map(approval => ({
              role: approval.role,
              email: approval.approver?.email || '',
              timestamp: approval.approvedAt,
              status: approval.status,
              justification: approval.justification,
              approverId: approval.approverId,
              approverName: approval.approver?.name,
            })),
          }))
        : undefined,
      createdAt: showSensitiveData ? defense.createdAt : undefined,
      updatedAt: showSensitiveData ? defense.updatedAt : undefined,
    };
  }

  static serializeList(defenses: Defense[], currentUser: CurrentUser): DefenseResponseDto[] {
    return defenses.map((defense) => this.serialize(defense, currentUser));
  }

  static serializeListItems(defenses: Defense[]): DefenseListItemDto[] {
    return defenses.map((defense) => DefenseListItemDto.fromEntity(defense));
  }

  static serializeToHttpResponse(defense: Defense, currentUser?: CurrentUser): HttpResponse<DefenseResponseDto> {
    const serialized = currentUser
      ? this.serialize(defense, currentUser)
      : DefenseResponseDto.fromEntity(defense);
    return HttpResponseSerializer.serialize(serialized);
  }

  static serializeListToResponse(
    defenses: Defense[],
    page: number,
    perPage: number,
    total: number,
  ): ListDefensesResponseDto {
    return {
      data: this.serializeListItems(defenses),
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }
}
