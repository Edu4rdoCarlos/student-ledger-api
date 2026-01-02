import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentResponseDto } from '../../presentation/dtos';

export interface ListStudentsQuery {
  courseId?: string;
}

@Injectable()
export class ListStudentsUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(query?: ListStudentsQuery): Promise<StudentResponseDto[]> {
    const students = query?.courseId
      ? await this.studentRepository.findByCourseId(query.courseId)
      : await this.studentRepository.findAll();

    return students.map(StudentResponseDto.fromEntity);
  }
}
