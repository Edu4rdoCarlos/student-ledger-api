import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentResponseDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../shared/dtos';

export interface ListStudentsQuery {
  courseId?: string;
  page?: number;
  limit?: number;
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
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.studentRepository.findAll({
      skip,
      take: limit,
      courseId: query?.courseId,
    });

    return {
      data: items.map(StudentResponseDto.fromEntity),
      metadata: new PaginationMetadata({ page, perPage: limit, total }),
    };
  }
}
