import { Inject, Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Coordinator } from '../../domain/entities';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../ports';
import { CoordinatorAlreadyExistsError, CourseRequiredError } from '../../domain/errors';
import { CreateCoordinatorDto, CoordinatorResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY, User } from '../../../auth/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { Course } from '../../../courses/domain/entities';
import { generateRandomPassword } from '../../../../../shared/utils';
import { SendEmailUseCase } from '../../../../toolkit/notifications/application/use-cases';
import { EmailTemplate } from '../../../../toolkit/notifications/domain/enums';
import { CertificateQueueService } from '../../../../toolkit/fabric/application/services/certificate-queue.service';

@Injectable()
export class CreateCoordinatorUseCase {
  private readonly logger = new Logger(CreateCoordinatorUseCase.name);

  constructor(
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly certificateQueue: CertificateQueueService,
  ) {}

  async execute(dto: CreateCoordinatorDto): Promise<CoordinatorResponseDto> {
    const course = await this.validateAndGetCourse(dto.courseId);
    await this.validateEmailAvailability(dto.email);

    const { user, password } = await this.createUser(dto);
    const coordinator = await this.createCoordinator(user, course);

    this.triggerPostCreationActions(coordinator, password);

    return CoordinatorResponseDto.fromEntity(coordinator);
  }

  private async validateAndGetCourse(courseId: string | undefined): Promise<Course> {
    if (!courseId) {
      throw new CourseRequiredError();
    }

    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const existingCoordinator = await this.coordinatorRepository.findByCourseId(courseId);
    if (existingCoordinator?.isActive) {
      throw new ConflictException(
        'Este curso já possui um coordenador ativo. Inative o coordenador atual antes de atribuir um novo.',
      );
    }

    return course;
  }

  private async validateEmailAvailability(email: string): Promise<void> {
    const [emailExists, coordinatorExists] = await Promise.all([
      this.userRepository.existsByEmail(email),
      this.coordinatorRepository.existsByUserId(email),
    ]);

    if (emailExists) {
      throw new ConflictException('Email já cadastrado no sistema');
    }

    if (coordinatorExists) {
      throw new CoordinatorAlreadyExistsError();
    }
  }

  private async createUser(dto: CreateCoordinatorDto): Promise<{ user: User; password: string }> {
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: Role.COORDINATOR,
    });

    return { user, password };
  }

  private async createCoordinator(user: User, course: Course): Promise<Coordinator> {
    const coordinator = Coordinator.create({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      courseId: course.id,
      isActive: true,
    });

    return this.coordinatorRepository.create(coordinator);
  }

  private triggerPostCreationActions(coordinator: Coordinator, password: string): void {
    this.enqueueCertificate(coordinator);
    this.sendWelcomeEmail(coordinator, password);
  }

  private enqueueCertificate(coordinator: Coordinator): void {
    this.certificateQueue
      .enqueueCertificateGeneration(coordinator.id, coordinator.email, Role.COORDINATOR)
      .catch(error => this.logger.error(`Falha ao enfileirar certificado: ${error.message}`));
  }

  private sendWelcomeEmail(coordinator: Coordinator, password: string): void {
    this.sendEmailUseCase
      .execute({
        userId: coordinator.id,
        to: coordinator.email,
        subject: 'Bem-vindo ao Student Ledger - Credenciais de Acesso',
        template: {
          id: EmailTemplate.USER_CREDENTIALS,
          data: {
            name: coordinator.name,
            email: coordinator.email,
            temporaryPassword: password,
            role: 'COORDINATOR',
          },
        },
      })
      .catch(error => this.logger.error(`Falha ao enviar email de boas-vindas: ${error.message}`));
  }
}
