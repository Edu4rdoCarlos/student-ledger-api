import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentResponseDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../shared/dtos';
import { ICurrentUser } from '../../../../shared/types';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';

export interface ListStudentsQuery {
  page?: number;
  perPage?: number;
}

export interface ListStudentsResponse {
  data: StudentResponseDto[];
  metadata: PaginationMetadata;
}

@Injectable()
export class ListStudentsUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(currentUser: ICurrentUser, query?: ListStudentsQuery): Promise<ListStudentsResponse> {
    const page = query?.page || 1;
    const perPage = query?.perPage || 10;
    const skip = (page - 1) * perPage;
    const courseId = currentUser?.courseId;

    const { items, total } = await this.studentRepository.findAll({
      skip,
      take: perPage,
      courseId,
    });

    if (items.length === 0) {
      return {
        data: [],
        metadata: new PaginationMetadata({ page, perPage, total }),
      };
    }

    const uniqueCourseIds = courseId ? [courseId] : [...new Set(items.map(student => student.courseId))];

    const fetchedCourses = await Promise.all(
      uniqueCourseIds.map(id => this.courseRepository.findById(id))
    );

    const courseMap = new Map(
      fetchedCourses.filter(course => course !== null).map(course => [course!.id, course!]),
    );

    const data = items.map((student) => {
      const course = courseMap.get(student.courseId);

      if (!course) {
        throw new Error(`Course with ID ${student.courseId} not found for student ${student.id}`);
      }

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
        createdAt: student.createdAt!,
        updatedAt: student.updatedAt!,
      };
    });

    return {
      data,
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }
}
