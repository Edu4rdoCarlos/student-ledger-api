import { Inject, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { ChangePasswordDto } from '../../../../shared/dtos';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, dto: ChangePasswordDto): Promise<void> {
    const advisor = await this.advisorRepository.findById(id);
    if (!advisor) {
      throw new NotFoundException(`Orientador não encontrado: ${id}`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: advisor.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isFirstAccess: false,
      },
    });
  }
}
