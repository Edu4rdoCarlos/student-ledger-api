import { Inject, Injectable } from '@nestjs/common';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { AdvisorNotFoundError } from '../../domain/errors';
import { UpdateAdvisorDto, AdvisorResponseDto } from '../../presentation/dtos';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class UpdateAdvisorUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, dto: UpdateAdvisorDto): Promise<AdvisorResponseDto> {
    const advisor = await this.advisorRepository.findById(id);
    if (!advisor) {
      throw new AdvisorNotFoundError(id);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.name !== undefined) {
        await tx.user.update({
          where: { id: advisor.userId },
          data: { name: dto.name },
        });
      }

      if (dto.departmentId !== undefined || dto.specialization !== undefined || dto.courseId !== undefined) {
        advisor.update({
          departmentId: dto.departmentId,
          specialization: dto.specialization,
          courseId: dto.courseId,
        });
        const updated = await tx.advisor.update({
          where: { id: advisor.id },
          data: {
            departmentId: advisor.departmentId || null,
            specialization: advisor.specialization || null,
            courseId: advisor.courseId || null,
            updatedAt: advisor.updatedAt,
          },
        });
        return updated;
      }

      return await tx.advisor.findUnique({ where: { id: advisor.id } });
    });

    const updated = await this.advisorRepository.findById(id);
    return AdvisorResponseDto.fromEntity(updated!);
  }
}
