import { StudentListItemDto } from '../dtos';
import { Student } from '../../domain/entities';
import { Course } from '../../../courses/domain/entities';
import { Defense } from '../../../defenses/domain/entities';
import { StudentStatus } from '@/shared/enums';

export class StudentListItemSerializer {
  static serialize(
    student: Student,
    course: Course,
    defenses: Defense[]
  ): StudentListItemDto {
    return {
      userId: student.id,
      registration: student.matricula,
      name: student.name,
      email: student.email,
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      defensesCount: defenses.length,
      status: this.calculateStatus(defenses),
    };
  }

  private static calculateStatus(defenses: Defense[]): StudentStatus {
    if (defenses.length === 0) return StudentStatus.NO_DEFENSE;

    const latestCompletedDefense = this.getLatestCompletedDefense(defenses);
    if (!latestCompletedDefense) return StudentStatus.PENDING;

    const hasDocumentsPending = this.hasDocumentsPendingApproval(latestCompletedDefense);

    if (latestCompletedDefense.result === 'APPROVED') {
      return hasDocumentsPending ? StudentStatus.UNDER_APPROVAL : StudentStatus.APPROVED;
    }

    if (latestCompletedDefense.result === 'FAILED') {
      return hasDocumentsPending ? StudentStatus.UNDER_APPROVAL : StudentStatus.FAILED;
    }

    return StudentStatus.PENDING;
  }

  private static hasDocumentsPendingApproval(defense: Defense): boolean {
    if (!defense.documents || defense.documents.length === 0) return false;
    return defense.documents.some(doc => doc.status === 'PENDING');
  }

  private static getLatestCompletedDefense(defenses: Defense[]): Defense | null {
    const completedDefenses = defenses.filter(d => d.status === 'COMPLETED');
    if (completedDefenses.length === 0) return null;

    return completedDefenses.reduce((latest, current) =>
      new Date(current.defenseDate) > new Date(latest.defenseDate) ? current : latest
    );
  }
}
