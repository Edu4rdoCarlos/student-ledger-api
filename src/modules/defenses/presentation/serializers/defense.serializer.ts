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

    const isDefenseParticipant =
      defense.advisor?.id === currentUser.id || defense.students?.some((s) => s.id === currentUser.id);

    const isApproved = defense.result === 'APPROVED';

    const hasFullAccess = isAdmin || isCoordinator || isDefenseParticipant;

    const showSensitiveData = hasFullAccess;
    const showFinalGrade = hasFullAccess || (isApproved && (isAdvisor || isStudent));
    const showDocuments = hasFullAccess || isApproved;

    // Only ADMIN, COORDINATOR, or participants can download, and ONLY if defense is APPROVED
    const canDownloadDocuments = (isAdmin || isCoordinator || isDefenseParticipant) && isApproved;

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
      documents: showDocuments
        ? defense.documents?.map((d) => ({
            id: d.id,
            type: d.type,
            version: d.version,
            documentHash: d.documentHash,
            mongoFileId: d.mongoFileId,
            status: d.status,
            blockchainTxId: d.blockchainTxId,
            blockchainRegisteredAt: d.blockchainRegisteredAt,
            defenseId: d.defenseId,
            previousVersionId: d.previousVersionId,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            downloadUrl: canDownloadDocuments ? d.downloadUrl : undefined,
          }))
        : undefined,
      createdAt: showSensitiveData ? defense.createdAt : undefined,
      updatedAt: showSensitiveData ? defense.updatedAt : undefined,
    };
  }

  static serializeList(defenses: Defense[], currentUser: CurrentUser): DefenseResponseDto[] {
    return defenses.map((defense) => this.serialize(defense, currentUser));
  }
}
