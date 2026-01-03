import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../ports/user.repository.port';
import { ITokenService, TOKEN_SERVICE, GeneratedTokens } from '../ports/token.service.port';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../ports/refresh-token.repository';

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(refreshToken: string): Promise<GeneratedTokens & { isFirstAccess: boolean }> {
    try {
      const payload = this.tokenService.verifyRefreshToken(refreshToken);

      const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);

      if (!storedToken || storedToken.revokedAt) {
        throw new UnauthorizedException('Refresh token revogado ou invalido');
      }

      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expirado');
      }

      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuario nao encontrado');
      }

      await this.refreshTokenRepository.revokeByToken(refreshToken);

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
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }
  }
}
