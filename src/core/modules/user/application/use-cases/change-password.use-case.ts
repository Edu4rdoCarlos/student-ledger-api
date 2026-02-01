import { Inject, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from '../../../../../shared/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findAndValidateUser(userId);
    await this.validateCurrentPassword(dto.currentPassword, user.password);
    const hashedPassword = await this.hashPassword(dto.newPassword);
    await this.userRepository.changePassword(user.id, hashedPassword);
  }

  private async findAndValidateUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  private async validateCurrentPassword(currentPassword: string, storedPassword: string): Promise<void> {
    const isPasswordValid = await bcrypt.compare(currentPassword, storedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
