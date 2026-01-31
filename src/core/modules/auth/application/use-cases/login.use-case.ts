import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY } from '../ports/user.repository.port';
import { ITokenService, TOKEN_SERVICE, GeneratedTokens } from '../ports/token.service.port';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../ports/refresh-token.repository';

export interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: LoginInput): Promise<GeneratedTokens & { isFirstAccess: boolean }> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const tokens = this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.refreshTokenRepository.create(
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiresAt,
    );

    return {
      ...tokens,
      isFirstAccess: user.isFirstAccess ?? true,
    };
  }
}
