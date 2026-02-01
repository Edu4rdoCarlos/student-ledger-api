import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IUserRepository, USER_REPOSITORY, User } from '../../../auth/application/ports';
import { BasicUserResponseDto } from '../../presentation/dtos';

@Injectable()
export class GetBasicUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, courseId?: string): Promise<BasicUserResponseDto> {
    const user = await this.findAndValidateUser(userId);
    return this.buildResponse(user, courseId);
  }

  private async findAndValidateUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  private buildResponse(user: User, courseId?: string): BasicUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      isFirstAccess: user.isFirstAccess ?? false,
      courseId,
    };
  }
}
