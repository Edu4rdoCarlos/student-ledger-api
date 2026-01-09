import { Inject, Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Student } from '../../domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { CreateStudentDto, StudentResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { generateRandomPassword } from '../../../../shared/utils';
import { ICurrentUser } from '../../../../shared/types';

@Injectable()
export class CreateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(dto: CreateStudentDto, currentUser?: ICurrentUser): Promise<StudentResponseDto> {
    if (currentUser?.role === 'COORDINATOR') {
      if (!currentUser.courseId) {
        throw new ForbiddenException('Coordenador não está associado a nenhum curso');
      }
      if (dto.courseId !== currentUser.courseId) {
        throw new ForbiddenException('Coordenador só pode cadastrar alunos do seu próprio curso');
      }
    }

    const [emailExists, matriculaExists, course] = await Promise.all([
      this.userRepository.existsByEmail(dto.email),
      this.studentRepository.existsByMatricula(dto.registration),
      this.courseRepository.findById(dto.courseId),
    ]);

    if (emailExists || matriculaExists) {
      throw new ConflictException('Email ou matrícula já cadastrados no sistema');
    }

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: Role.STUDENT,
    });

    const student = Student.create({
      id: user.id,
      matricula: dto.registration,
      courseId: dto.courseId,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const created = await this.studentRepository.create(student);

    return {
      userId: created.id,
      registration: created.matricula,
      name: created.name,
      email: created.email,
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      createdAt: created.createdAt!,
      updatedAt: created.updatedAt!,
    };
  }
}
