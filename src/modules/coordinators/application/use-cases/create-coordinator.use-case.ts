import { Inject, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Coordinator } from '../../domain/entities';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../ports';
import { CoordinatorAlreadyExistsError, CourseRequiredError } from '../../domain/errors';
import { CreateCoordinatorDto, CoordinatorResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { generateRandomPassword } from '../../../../shared/utils';

@Injectable()
export class CreateCoordinatorUseCase {
  constructor(
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(dto: CreateCoordinatorDto): Promise<CoordinatorResponseDto> {
    if (!dto.courseId) {
      throw new CourseRequiredError();
    }

    const courseExists = await this.courseRepository.findByCode(dto.courseId);
    if (!courseExists) {
      throw new NotFoundException(`Curso com código ${dto.courseId} não encontrado`);
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
      organizationId: dto.organizationId,
    });

    const coordinator = Coordinator.create({
      userId: user.id,
      courseId: courseExists.id,
      isActive: true,
    });

    const created = await this.coordinatorRepository.create(coordinator);
    return CoordinatorResponseDto.fromEntity(created);
  }
}
