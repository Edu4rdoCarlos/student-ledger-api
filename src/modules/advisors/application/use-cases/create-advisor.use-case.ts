import { Inject, Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Advisor } from '../../domain/entities';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { AdvisorUserAlreadyExistsError } from '../../domain/errors';
import { CreateAdvisorDto, AdvisorResponseDto } from '../../presentation/dtos';
import { PrismaService } from '../../../../shared/prisma';
import { generateRandomPassword } from '../../../../shared/utils';

@Injectable()
export class CreateAdvisorUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: CreateAdvisorDto): Promise<AdvisorResponseDto> {
    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (emailExists) {
      throw new ConflictException(`Email já cadastrado: ${dto.email}`);
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: Role.ADVISOR,
          organizationId: dto.organizationId,
        },
      });

      const advisor = Advisor.create({
        userId: user.id,
        departmentId: dto.departmentId,
        specialization: dto.specialization,
        courseId: dto.courseId,
      });

      const createdAdvisor = await tx.advisor.create({
        data: {
          id: advisor.id,
          userId: advisor.userId,
          departmentId: advisor.departmentId || null,
          specialization: advisor.specialization || null,
          courseId: advisor.courseId || null,
          createdAt: advisor.createdAt,
          updatedAt: advisor.updatedAt,
        },
      });

      return createdAdvisor;
    });

    const created = Advisor.create(
      {
        userId: result.userId,
        departmentId: result.departmentId || undefined,
        specialization: result.specialization || undefined,
        courseId: result.courseId || undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      result.id,
    );

    return AdvisorResponseDto.fromEntity(created);
  }
}
