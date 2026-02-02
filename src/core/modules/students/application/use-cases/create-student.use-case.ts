import { Inject, Injectable, ConflictException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Student } from '../../domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { CreateStudentDto, StudentResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY, User } from '../../../auth/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { Course } from '../../../courses/domain/entities';
import { generateRandomPassword } from '../../../../../shared/utils';
import { ICurrentUser } from '../../../../../shared/types';
import { SendEmailUseCase } from '../../../../toolkit/notifications/application/use-cases';
import { EmailTemplate } from '../../../../toolkit/notifications/domain/enums';
import { CertificateQueueService } from '../../../../toolkit/fabric/infra/queue/certificate-queue';

@Injectable()
export class CreateStudentUseCase {
  private readonly logger = new Logger(CreateStudentUseCase.name);

  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly certificateQueue: CertificateQueueService,
  ) {}

  async execute(dto: CreateStudentDto, currentUser?: ICurrentUser): Promise<StudentResponseDto> {
    this.validateCoordinatorAccess(dto.courseId, currentUser);
    const course = await this.validateUniqueConstraintsAndGetCourse(dto);
    const randomPassword = generateRandomPassword();
    const user = await this.createUser(dto, randomPassword);
    const created = await this.createStudent(dto, user);

    this.enqueueCertificateGeneration(created);
    this.sendWelcomeEmail(created, randomPassword);

    return this.buildResponse(created, course);
  }

  private validateCoordinatorAccess(courseId: string, currentUser?: ICurrentUser): void {
    if (currentUser?.role !== Role.COORDINATOR) {
      return;
    }

    if (!currentUser.courseId) {
      throw new ForbiddenException('Coordenador não está associado a nenhum curso');
    }

    if (courseId !== currentUser.courseId) {
      throw new ForbiddenException('Coordenador só pode cadastrar alunos do seu próprio curso');
    }
  }

  private async validateUniqueConstraintsAndGetCourse(dto: CreateStudentDto) {
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

    return course;
  }

  private async createUser(dto: CreateStudentDto, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: Role.STUDENT,
    });
  }

  private async createStudent(dto: CreateStudentDto, user: User): Promise<Student> {
    const student = Student.create({
      id: user.id,
      matricula: dto.registration,
      courseId: dto.courseId,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return this.studentRepository.create(student);
  }

  private enqueueCertificateGeneration(student: Student): void {
    this.certificateQueue.enqueueCertificateGeneration(
      student.id,
      student.email,
      Role.STUDENT,
    );
  }

  private sendWelcomeEmail(student: Student, password: string): void {
    this.sendEmailUseCase.execute({
      userId: student.id,
      to: student.email,
      subject: 'Bem-vindo ao Student Ledger - Credenciais de Acesso',
      template: {
        id: EmailTemplate.USER_CREDENTIALS,
        data: {
          name: student.name,
          email: student.email,
          temporaryPassword: password,
          role: Role.STUDENT,
        },
      },
    }).catch((error) => {
      this.logger.error(`Falha ao enviar email de boas-vindas: ${error.message}`);
    });
  }

  private buildResponse(student: Student, course: Course): StudentResponseDto {
    return {
      userId: student.id,
      registration: student.matricula,
      name: student.name,
      email: student.email,
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      createdAt: student.createdAt!,
      updatedAt: student.updatedAt!,
    };
  }
}
