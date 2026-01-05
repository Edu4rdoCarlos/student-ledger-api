import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentNotFoundError } from '../../domain/errors';
import { UpdateStudentDto, StudentResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';

@Injectable()
export class UpdateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(matricula: string, dto: UpdateStudentDto): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findByMatricula(matricula);
    if (!student) {
      throw new StudentNotFoundError(matricula);
    }

    if (dto.name !== undefined) {
      await this.userRepository.updateName(student.userId, dto.name);
    }

    if (dto.courseId !== undefined) {
      student.updateCourse(dto.courseId);
      await this.studentRepository.update(student);
    }

    const updated = await this.studentRepository.findByMatricula(matricula);
    return StudentResponseDto.fromEntity(updated!);
  }
}
