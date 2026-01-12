import { StudentListItemDto } from '../dtos';
import { Student } from '../../domain/entities';
import { Course } from '../../../courses/domain/entities';
import { Defense } from '../../../defenses/domain/entities';

export class StudentListItemSerializer {
  static serialize(
    student: Student,
    course: Course,
    defenses: Defense[]
  ): StudentListItemDto {
    const latestDefense = this.getLatestDefense(defenses);

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
      defenseStatus: latestDefense?.status,
    };
  }

  private static getLatestDefense(defenses: Defense[]): Defense | null {
    if (defenses.length === 0) return null;
    return defenses.reduce((latest, current) =>
      new Date(current.defenseDate) > new Date(latest.defenseDate) ? current : latest
    );
  }
}
