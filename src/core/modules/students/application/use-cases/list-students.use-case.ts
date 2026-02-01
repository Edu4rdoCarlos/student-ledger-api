import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentListItemDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../../shared/dtos';
import { ICurrentUser } from '../../../../../shared/types';
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

  async execute(currentUser: ICurrentUser, query?: ListStudentsQuery): Promise<ListStudentsResponse> {
    const { page, perPage, skip } = this.calculatePagination(query);
    const courseIds = await this.getFilteredCourseIds(currentUser);
    const { items, total } = await this.studentRepository.findAll({ skip, take: perPage, courseIds });

    if (items.length === 0) {
      return this.buildEmptyResponse(page, perPage, total);
    }

    const courseMap = await this.fetchCoursesMap(items);
    const defensesResults = await this.fetchDefenses(items);
    const data = this.serializeStudents(items, courseMap, defensesResults);

    return {
      data,
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }

  private calculatePagination(query?: ListStudentsQuery) {
    const page = query?.page || 1;
    const perPage = query?.perPage || 10;
    const skip = (page - 1) * perPage;
    return { page, perPage, skip };
  }

  private async getFilteredCourseIds(currentUser: ICurrentUser): Promise<string[] | undefined> {
    if (currentUser?.role === Role.COORDINATOR) {
      return this.getCoordinatorCourseIds(currentUser.id);
    }
    return undefined;
  }

  private async getCoordinatorCourseIds(coordinatorId: string): Promise<string[]> {
    const courses = await this.courseRepository.findByCoordinatorId(coordinatorId);
    return courses.map(course => course.id);
  }

  private buildEmptyResponse(page: number, perPage: number, total: number): ListStudentsResponse {
    return {
      data: [],
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }

  private async fetchCoursesMap(students: any[]) {
    const uniqueCourseIds = [...new Set(students.map(student => student.courseId))];
    const fetchedCourses = await Promise.all(
      uniqueCourseIds.map(id => this.courseRepository.findById(id))
    );
    return new Map(
      fetchedCourses.filter(course => course !== null).map(course => [course!.id, course!]),
    );
  }

  private async fetchDefenses(students: any[]) {
    const defensesPromises = students.map(student =>
      this.defenseRepository.findByStudentId(student.id)
    );
    return Promise.all(defensesPromises);
  }

  private serializeStudents(students: any[], courseMap: Map<string, any>, defensesResults: any[]): StudentListItemDto[] {
    return students.map((student, index) => {
      const course = courseMap.get(student.courseId);
      if (!course) {
        throw new Error(`Course with ID ${student.courseId} not found for student ${student.id}`);
      }
      const defenses = defensesResults[index];
      return StudentListItemSerializer.serialize(student, course, defenses);
    });
  }
}
