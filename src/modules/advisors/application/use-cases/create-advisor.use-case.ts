import { Inject, Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Advisor } from '../../domain/entities';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { CreateAdvisorDto, AdvisorResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { generateRandomPassword } from '../../../../shared/utils';

@Injectable()
export class CreateAdvisorUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateAdvisorDto): Promise<AdvisorResponseDto> {
    const emailExists = await this.userRepository.existsByEmail(dto.email);
    if (emailExists) {
      throw new ConflictException('Não foi possível criar o orientador. Verifique os dados fornecidos.');
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: Role.ADVISOR,
    });

    const advisor = Advisor.create({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      specialization: dto.specialization,
      courseId: dto.courseId,
      isActive: true,
    });

    const created = await this.advisorRepository.create(advisor);
    return AdvisorResponseDto.fromEntity(created);
  }
}
