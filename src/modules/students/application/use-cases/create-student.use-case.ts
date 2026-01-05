import { Inject, Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Student } from '../../domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentMatriculaAlreadyExistsError } from '../../domain/errors';
import { CreateStudentDto, StudentResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { generateRandomPassword } from '../../../../shared/utils';

@Injectable()
export class CreateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateStudentDto): Promise<StudentResponseDto> {
    const [emailExists, matriculaExists] = await Promise.all([
      this.userRepository.existsByEmail(dto.email),
      this.studentRepository.existsByMatricula(dto.registration),
    ]);

    if (emailExists || matriculaExists) {
      throw new ConflictException('Email ou matrícula já cadastrados no sistema');
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: Role.STUDENT,
      organizationId: dto.organizationId,
    });

    const student = Student.create({
      matricula: dto.registration,
      userId: user.id,
      courseId: dto.courseId,
    });

    const created = await this.studentRepository.create(student);
    return StudentResponseDto.fromEntity(created);
  }
}
