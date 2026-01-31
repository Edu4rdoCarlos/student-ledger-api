import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, Inject, UnauthorizedException } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { LoginUseCase, RefreshTokensUseCase, LogoutUseCase } from '../../application/use-cases';
import { ICookieService, COOKIE_SERVICE } from '../../application/ports';
import { LoginDto, LoginResponseDto, LoginHttpResponseDto } from '../dtos';
import { Public, Roles } from '../../../../../shared/decorators';
import { HttpResponse, HttpResponseSerializer } from '../../../../../shared';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    @Inject(COOKIE_SERVICE)
    private readonly cookieService: ICookieService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Perform login',
    description: 'Authenticates the user and returns an access token. The refresh token is sent via HTTP-only cookie.',
  })
  @ApiResponse({ status: 200, description: 'Login successful. Refresh token sent via HTTP-only cookie.', type: LoginHttpResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<LoginResponseDto>> {
    const { accessToken, refreshToken, expiresIn, isFirstAccess } = await this.loginUseCase.execute(dto);

    this.cookieService.setRefreshToken(res, refreshToken);

    return HttpResponseSerializer.serialize({ accessToken, expiresIn, isFirstAccess });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary: 'Renew tokens',
    description: 'Renews the access token using the refresh token from the cookie. Implements token rotation: the current refresh token is revoked and a new one is generated.',
  })
  @ApiResponse({ status: 200, description: 'Tokens renewed successfully. New refresh token sent via HTTP-only cookie.', type: LoginHttpResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or revoked refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<LoginResponseDto>> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { accessToken, refreshToken: newRefreshToken, expiresIn, isFirstAccess } =
      await this.refreshTokensUseCase.execute(refreshToken);

    this.cookieService.setRefreshToken(res, newRefreshToken);

    return HttpResponseSerializer.serialize({ accessToken, expiresIn, isFirstAccess });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'COORDINATOR', 'ADVISOR', 'STUDENT')
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary: 'Perform logout',
    description: 'Revokes the refresh token in the database and clears the cookie. Existing tokens are invalidated.',
  })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      await this.logoutUseCase.execute(refreshToken);
    }

    this.cookieService.clearRefreshToken(res);
  }
}
