import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentNotFoundError } from '../../domain/errors';
import { StudentResponseDto } from '../../presentation/dtos';

@Injectable()
export class GetStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(matricula: string): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findByMatricula(matricula);

    if (!student) {
      throw new StudentNotFoundError(matricula);
    }

    return StudentResponseDto.fromEntity(student);
  }
}
