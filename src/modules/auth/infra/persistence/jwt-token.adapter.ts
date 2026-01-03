import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ITokenService, TokenPayload, GeneratedTokens } from '../../application/ports';
import { parseExpiresInToSeconds } from '../../../../shared/utils';

@Injectable()
export class JwtTokenAdapter implements ITokenService {
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly refreshTokenSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    this.refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret');
  }

  generateTokens(payload: TokenPayload): GeneratedTokens {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiresIn,
    });

    const refreshTokenExpiresInSeconds = parseExpiresInToSeconds(this.refreshTokenExpiresIn);
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiresInSeconds * 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn: parseExpiresInToSeconds(this.accessTokenExpiresIn),
      refreshTokenExpiresAt,
    };
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token, {
      secret: this.refreshTokenSecret,
    });
  }
}
