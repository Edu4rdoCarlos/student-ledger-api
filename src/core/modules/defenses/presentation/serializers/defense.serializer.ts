import { Role, DefenseResult } from '@prisma/client';
import { Defense } from '../../domain/entities';
import { DefenseResponseDto, ListDefensesResponseDto, DefenseListItemDto } from '../dtos/response';
import { PaginationMetadata, HttpResponse } from '../../../../../shared/dtos';
import { HttpResponseSerializer } from '../../../../../shared/serializers';

interface CurrentUser {
  id: string;
  role: Role;
}

export class DefenseSerializer {
  static serialize(defense: Defense, currentUser: CurrentUser): DefenseResponseDto {
    const permissions = DefenseSerializer.calculatePermissions(defense, currentUser);
    const course = DefenseSerializer.extractCourseInfo(defense);

    return {
      id: defense.id,
      title: defense.title,
      defenseDate: defense.defenseDate,
      location: permissions.showSensitiveData ? defense.location : undefined,
      finalGrade: permissions.showFinalGrade ? defense.finalGrade : undefined,
      result: defense.result,
      status: defense.status,
      advisor: DefenseSerializer.serializeAdvisor(defense, permissions.showSensitiveData),
      students: DefenseSerializer.serializeStudents(defense, permissions.showSensitiveData),
      course,
      examBoard: permissions.showSensitiveData ? DefenseSerializer.serializeExamBoard(defense) : undefined,
      documents: permissions.showDocuments ? DefenseSerializer.serializeDocuments(defense) : undefined,
      createdAt: permissions.showSensitiveData ? defense.createdAt : undefined,
      updatedAt: permissions.showSensitiveData ? defense.updatedAt : undefined,
    };
  }

  private static calculatePermissions(defense: Defense, currentUser: CurrentUser): {
    showSensitiveData: boolean;
    showFinalGrade: boolean;
    showDocuments: boolean;
  } {
    const isAdmin = currentUser.role === Role.ADMIN;
    const isCoordinator = currentUser.role === Role.COORDINATOR;
    const isAdvisor = currentUser.role === Role.ADVISOR;
    const isStudent = currentUser.role === Role.STUDENT;

    const isDefenseParticipant =
      defense.advisor?.id === currentUser.id ||
      (defense.students?.some((s) => s.id === currentUser.id) ?? false);

    const isApproved = defense.result === DefenseResult.APPROVED;
    const hasFullAccess = isAdmin || isCoordinator || isDefenseParticipant;

    return {
      showSensitiveData: hasFullAccess,
      showFinalGrade: hasFullAccess || (isApproved && (isAdvisor || isStudent)),
      showDocuments: hasFullAccess || isApproved,
    };
  }

  private static extractCourseInfo(defense: Defense) {
    const firstStudent = defense.students?.[0];
    const course = firstStudent?.course || { id: '', code: '', name: '' };
    return {
      id: course.id,
      code: course.code,
      name: course.name,
    };
  }

  private static serializeAdvisor(defense: Defense, showSensitiveData: boolean) {
    return {
      id: defense.advisor?.id ?? '',
      name: defense.advisor?.name ?? '',
      email: showSensitiveData ? defense.advisor?.email : undefined,
      specialization: defense.advisor?.specialization,
      isActive: defense.advisor?.isActive ?? true,
    };
  }

  private static serializeStudents(defense: Defense, showSensitiveData: boolean) {
    return defense.students?.map((s) => ({
      id: s.id,
      name: s.name,
      email: showSensitiveData ? s.email : undefined,
      registration: showSensitiveData ? s.registration : undefined,
      course: s.course,
    })) ?? [];
  }

  private static serializeExamBoard(defense: Defense) {
    return defense.examBoard?.map((member) => ({
      id: member.id!,
      name: member.name,
      email: member.email,
    }));
  }

  private static serializeDocuments(defense: Defense) {
    return defense.documents?.map((d) => ({
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
    }));
  }

  static serializeList(defenses: Defense[], currentUser: CurrentUser): DefenseResponseDto[] {
    return defenses.map((defense) => DefenseSerializer.serialize(defense, currentUser));
  }

  static serializeListItems(defenses: Defense[]): DefenseListItemDto[] {
    return defenses.map((defense) => DefenseListItemDto.fromEntity(defense));
  }

  static serializeToHttpResponse(defense: Defense, currentUser?: CurrentUser): HttpResponse<DefenseResponseDto> {
    const serialized = currentUser
      ? DefenseSerializer.serialize(defense, currentUser)
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
      data: DefenseSerializer.serializeListItems(defenses),
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }
}
