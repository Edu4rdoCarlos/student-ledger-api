import { Inject, Injectable } from '@nestjs/common';
import { Student } from '../../domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import {
  StudentMatriculaAlreadyExistsError,
  StudentUserAlreadyExistsError,
} from '../../domain/errors';
import { CreateStudentDto, StudentResponseDto } from '../../presentation/dtos';

@Injectable()
export class CreateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(dto: CreateStudentDto): Promise<StudentResponseDto> {
    const matriculaExists = await this.studentRepository.existsByMatricula(dto.matricula);
    if (matriculaExists) {
      throw new StudentMatriculaAlreadyExistsError(dto.matricula);
    }

    const userExists = await this.studentRepository.existsByUserId(dto.userId);
    if (userExists) {
      throw new StudentUserAlreadyExistsError(dto.userId);
    }

    const student = Student.create({
      matricula: dto.matricula,
      userId: dto.userId,
      courseId: dto.courseId,
    });

    const created = await this.studentRepository.create(student);
    return StudentResponseDto.fromEntity(created);
  }
}
