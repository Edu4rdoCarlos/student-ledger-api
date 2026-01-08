import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentResponseDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../shared/dtos';
import { ICurrentUser } from '../../../../shared/types';

export interface ListStudentsQuery {
  courseId?: string;
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
  ) {}

  async execute(query?: ListStudentsQuery, currentUser?: ICurrentUser): Promise<ListStudentsResponse> {
    const page = query?.page || 1;
    const perPage = query?.perPage || 10;
    const skip = (page - 1) * perPage;

    let courseId = query?.courseId;
    if (currentUser?.role === 'COORDINATOR' && currentUser.courseId) {
      courseId = currentUser.courseId;
    }

    const { items, total } = await this.studentRepository.findAll({
      skip,
      take: perPage,
      courseId,
    });

    return {
      data: items.map(student => StudentResponseDto.fromEntity(student)),
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }
}
