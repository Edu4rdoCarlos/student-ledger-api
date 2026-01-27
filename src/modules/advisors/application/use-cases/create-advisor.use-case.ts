import { Inject, Injectable, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Advisor } from '../../domain/entities';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { CreateAdvisorInput } from '../dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { generateRandomPassword } from '../../../../shared/utils';
import { SendEmailUseCase } from '../../../notifications/application/use-cases';
import { EmailTemplate } from '../../../notifications/domain/enums';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { CertificateQueueService } from '../../../fabric/application/services/certificate-queue.service';

@Injectable()
export class CreateAdvisorUseCase {
  private readonly logger = new Logger(CreateAdvisorUseCase.name);

  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly certificateQueue: CertificateQueueService,
  ) {}

  async execute(input: CreateAdvisorInput, currentUser: any): Promise<Advisor> {
    if (currentUser.role === Role.COORDINATOR) {
      const coordinator = await this.coordinatorRepository.findByUserId(currentUser.id);

      if (!coordinator) {
        throw new ForbiddenException('Coordenador não encontrado');
      }

      if (!coordinator.isActive || !coordinator.courseId) {
        throw new ForbiddenException('Coordenadores inativos ou sem curso não podem criar orientadores');
      }

      if (input.courseId && input.courseId !== coordinator.courseId) {
        throw new ForbiddenException('Você só pode criar orientadores para o seu curso');
      }

      if (!input.courseId) {
        input.courseId = coordinator.courseId;
      }
    }

    const emailExists = await this.userRepository.existsByEmail(input.email);
    if (emailExists) {
      throw new ConflictException('Não foi possível criar o orientador. Verifique os dados fornecidos.');
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = await this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: Role.ADVISOR,
    });

    const advisor = Advisor.create({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      specialization: input.specialization,
      courseId: input.courseId,
      isActive: true,
    });

    const created = await this.advisorRepository.create(advisor);

    await this.certificateQueue.enqueueCertificateGeneration(
      created.id,
      created.email,
      Role.ADVISOR,
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
          role: 'ADVISOR',
        },
      },
    }).catch((error) => {
      this.logger.error(`Falha ao enviar email de boas-vindas: ${error.message}`);
    });

    return created;
  }
}
