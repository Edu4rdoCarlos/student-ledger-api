import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentListItemDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../shared/dtos';
import { ICurrentUser } from '../../../../shared/types';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { StudentListItemSerializer } from '../../presentation/serializers';

export interface ListStudentsQuery {
  page?: number;
  perPage?: number;
}

export interface ListStudentsResponse {
  data: StudentListItemDto[];
  metadata: PaginationMetadata;
}

@Injectable()
export class ListStudentsUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  private async getCoordinatorCourseIds(coordinatorId: string): Promise<string[]> {
    const courses = await this.courseRepository.findByCoordinatorId(coordinatorId);
    return courses.map(course => course.id);
  }

  async execute(currentUser: ICurrentUser, query?: ListStudentsQuery): Promise<ListStudentsResponse> {
    const page = query?.page || 1;
    const perPage = query?.perPage || 10;
    const skip = (page - 1) * perPage;

    let courseIds: string[] | undefined;
    if (currentUser?.role === 'COORDINATOR') {
      courseIds = await this.getCoordinatorCourseIds(currentUser.id);
    }

    const { items, total } = await this.studentRepository.findAll({
      skip,
      take: perPage,
      courseIds,
    });

    if (items.length === 0) {
      return {
        data: [],
        metadata: new PaginationMetadata({ page, perPage, total }),
      };
    }

    const uniqueCourseIds = [...new Set(items.map(student => student.courseId))];

    const fetchedCourses = await Promise.all(
      uniqueCourseIds.map(id => this.courseRepository.findById(id))
    );

    const courseMap = new Map(
      fetchedCourses.filter(course => course !== null).map(course => [course!.id, course!]),
    );

    const defensesPromises = items.map(student =>
      this.defenseRepository.findByStudentId(student.id)
    );
    const defensesResults = await Promise.all(defensesPromises);

    const data = items.map((student, index) => {
      const course = courseMap.get(student.courseId);

      if (!course) {
        throw new Error(`Course with ID ${student.courseId} not found for student ${student.id}`);
      }

      const defenses = defensesResults[index];
      return StudentListItemSerializer.serialize(student, course, defenses);
    });

    return {
      data,
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }
}
