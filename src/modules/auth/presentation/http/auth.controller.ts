import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, Inject, UnauthorizedException } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { LoginUseCase, RefreshTokensUseCase, LogoutUseCase } from '../../application/use-cases';
import { ICookieService, COOKIE_SERVICE } from '../../application/ports';
import { LoginDto, LoginResponseDto, LoginHttpResponseDto } from '../dtos';
import { Public, Roles } from '../../../../shared/decorators';
import { HttpResponse, HttpResponseSerializer } from '../../../../shared';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

@ApiTags('Autenticação')
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
    summary: 'Realizar login',
    description: 'Autentica o usuario e retorna um access token. O refresh token e enviado via cookie HTTP-only.',
  })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso. Refresh token enviado via cookie HTTP-only.', type: LoginHttpResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais invalidas' })
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
    summary: 'Renovar tokens',
    description: 'Renova o access token usando o refresh token do cookie. Implementa rotacao de tokens: o refresh token atual e revogado e um novo e gerado.',
  })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso. Novo refresh token enviado via cookie HTTP-only.', type: LoginHttpResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token invalido, expirado ou revogado' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<LoginResponseDto>> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token nao encontrado');
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
    summary: 'Realizar logout',
    description: 'Revoga o refresh token no banco de dados e limpa o cookie. Tokens existentes sao invalidados.',
  })
  @ApiResponse({ status: 204, description: 'Logout realizado com sucesso' })
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
