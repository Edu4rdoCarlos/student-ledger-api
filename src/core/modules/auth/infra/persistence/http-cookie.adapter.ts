import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { ICookieService } from '../../application/ports';
import { parseExpiresInToMs } from '../../../../../shared/utils';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

@Injectable()
export class HttpCookieAdapter implements ICookieService {
  private readonly isProduction: boolean;
  private readonly refreshTokenMaxAge: number;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.refreshTokenMaxAge = parseExpiresInToMs(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
  }

  setRefreshToken(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      maxAge: this.refreshTokenMaxAge,
      path: '/',
    });
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      path: '/',
    });
  }
}
