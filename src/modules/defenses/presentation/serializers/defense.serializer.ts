import { Defense } from '../../domain/entities';
import { DefenseResponseDto } from '../dtos/response/defense-response.dto';

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

    const isDefenseAdvisor = defense.advisor?.id === currentUser.id;
    const isDefenseStudent = defense.students?.some((s) => s.id === currentUser.id) ?? false;

    const isApproved = defense.result === 'APPROVED';

    const hasFullAccess = isAdmin || isCoordinator || isDefenseAdvisor || isDefenseStudent;

    const showFinalGrade = hasFullAccess || (isApproved && (isAdvisor || isStudent));

    const showSensitiveData = hasFullAccess;

    const showDocuments = hasFullAccess || isApproved;

    return {
      id: defense.id,
      title: defense.title,
      defenseDate: defense.defenseDate,
      finalGrade: showFinalGrade ? defense.finalGrade : undefined,
      result: defense.result,
      advisor: {
        id: defense.advisor?.id ?? '',
        name: defense.advisor?.name ?? '',
        email: showSensitiveData ? defense.advisor?.email : undefined,
        specialization: defense.advisor?.specialization,
      },
      students:
        defense.students?.map((s) => ({
          id: s.id,
          name: s.name,
          email: showSensitiveData ? s.email : undefined,
          registration: showSensitiveData ? s.registration : undefined,
        })) ?? [],
      documents: showDocuments ? defense.documents : undefined,
      createdAt: showSensitiveData ? defense.createdAt : undefined,
      updatedAt: showSensitiveData ? defense.updatedAt : undefined,
    };
  }

  static serializeList(defenses: Defense[], currentUser: CurrentUser): DefenseResponseDto[] {
    return defenses.map((defense) => this.serialize(defense, currentUser));
  }
}
