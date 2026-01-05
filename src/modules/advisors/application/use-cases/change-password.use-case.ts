import { Inject, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { ChangePasswordDto } from '../../../../shared/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string, dto: ChangePasswordDto): Promise<void> {
    const advisor = await this.advisorRepository.findById(id);
    if (!advisor) {
      throw new NotFoundException(`Orientador não encontrado: ${id}`);
    }

    const user = await this.userRepository.findById(advisor.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.changePassword(user.id, hashedPassword, false);
  }
}
