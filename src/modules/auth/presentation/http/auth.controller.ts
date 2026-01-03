import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, Inject, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { LoginUseCase, RefreshTokensUseCase, LogoutUseCase } from '../../application/use-cases';
import { ICookieService, COOKIE_SERVICE } from '../../application/ports';
import { LoginDto, LoginResponseDto, LoginHttpResponseDto } from '../dtos';
import { Public } from '../../../../shared/decorators';
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
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso', type: LoginHttpResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<LoginResponseDto>> {
    const { accessToken, refreshToken, expiresIn } = await this.loginUseCase.execute(dto);

    this.cookieService.setRefreshToken(res, refreshToken);

    return HttpResponseSerializer.serialize({ accessToken, expiresIn });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acesso usando refresh token do cookie' })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso', type: LoginHttpResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<LoginResponseDto>> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token nao encontrado');
    }

    const { accessToken, refreshToken: newRefreshToken, expiresIn } =
      await this.refreshTokensUseCase.execute(refreshToken);

    this.cookieService.setRefreshToken(res, newRefreshToken);

    return HttpResponseSerializer.serialize({ accessToken, expiresIn });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar logout (limpar refresh token)' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<{ message: string }>> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      await this.logoutUseCase.execute(refreshToken);
    }

    this.cookieService.clearRefreshToken(res);

    return HttpResponseSerializer.serialize({ message: 'Logout realizado com sucesso' });
  }
}
