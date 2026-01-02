import { Inject, Injectable } from '@nestjs/common';
import { Student } from '../../domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import {
  StudentMatriculaAlreadyExistsError,
  StudentEmailAlreadyExistsError,
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

    const emailExists = await this.studentRepository.existsByEmail(dto.email);
    if (emailExists) {
      throw new StudentEmailAlreadyExistsError(dto.email);
    }

    const student = Student.create({
      matricula: dto.matricula,
      nome: dto.nome,
      email: dto.email,
      courseId: dto.courseId,
      organizationId: dto.organizationId,
    });

    const created = await this.studentRepository.create(student);
    return StudentResponseDto.fromEntity(created);
  }
}
