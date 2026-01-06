import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentResponseDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../shared/dtos';

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

  async execute(query?: ListStudentsQuery): Promise<ListStudentsResponse> {
    const page = query?.page || 1;
    const perPage = query?.perPage || 10;
    const skip = (page - 1) * perPage;

    const { items, total } = await this.studentRepository.findAll({
      skip,
      take: perPage,
      courseId: query?.courseId,
    });

    return {
      data: items.map(student => StudentResponseDto.fromEntity(student)),
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }
}
