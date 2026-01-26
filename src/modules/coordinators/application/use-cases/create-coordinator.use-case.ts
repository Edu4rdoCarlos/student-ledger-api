import { Inject, Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Coordinator } from '../../domain/entities';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../ports';
import { CoordinatorAlreadyExistsError, CourseRequiredError } from '../../domain/errors';
import { CreateCoordinatorDto, CoordinatorResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { generateRandomPassword } from '../../../../shared/utils';
import { SendEmailUseCase } from '../../../notifications/application/use-cases';
import { EmailTemplate } from '../../../notifications/domain/enums';
import { CertificateQueueService } from '../../../fabric/application/services/certificate-queue.service';

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
    if (!dto.courseId) {
      throw new CourseRequiredError();
    }

    const courseExists = await this.courseRepository.findById(dto.courseId);
    if (!courseExists) {
      throw new NotFoundException(`Curso não encontrado`);
    }

    // Verificar se o curso já tem um coordenador ativo
    const existingCoordinator = await this.coordinatorRepository.findByCourseId(dto.courseId);
    if (existingCoordinator && existingCoordinator.isActive) {
      throw new ConflictException('Este curso já possui um coordenador ativo. Inative o coordenador atual antes de atribuir um novo.');
    }

    const [emailExists, coordinatorExists] = await Promise.all([
      this.userRepository.existsByEmail(dto.email),
      this.coordinatorRepository.existsByUserId(dto.email),
    ]);

    if (emailExists) {
      throw new ConflictException('Email já cadastrado no sistema');
    }

    if (coordinatorExists) {
      throw new CoordinatorAlreadyExistsError();
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: Role.COORDINATOR,
    });

    const coordinator = Coordinator.create({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      courseId: courseExists.id,
      isActive: true,
    });

    const created = await this.coordinatorRepository.create(coordinator);

    await this.certificateQueue.enqueueCertificateGeneration(
      created.id,
      created.email,
      Role.COORDINATOR,
    );

    this.sendEmailUseCase.execute({
      userId: created.id,
      to: created.email,
      subject: 'Bem-vindo ao Student Ledger - Credenciais de Acesso',
      template: {
        id: EmailTemplate.USER_CREDENTIALS,
        data: {
          name: created.name,
          email: created.email,
          temporaryPassword: randomPassword,
          role: 'COORDINATOR',
        },
      },
    }).catch((error) => {
      this.logger.error(`Falha ao enviar email de boas-vindas: ${error.message}`);
    });

    return CoordinatorResponseDto.fromEntity(created);
  }
}
