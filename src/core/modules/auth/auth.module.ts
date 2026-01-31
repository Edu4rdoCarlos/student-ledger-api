import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../database/prisma';
import { AuthController } from './presentation/http';
import { JwtStrategy } from './strategies/jwt.strategy';
import { USER_REPOSITORY, TOKEN_SERVICE, COOKIE_SERVICE, REFRESH_TOKEN_REPOSITORY } from './application/ports';
import { LoginUseCase, RefreshTokensUseCase, LogoutUseCase } from './application/use-cases';
import { PrismaUserRepository, JwtTokenAdapter, HttpCookieAdapter, PrismaRefreshTokenRepository } from './infra/persistence';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Adapters
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenAdapter,
    },
    {
      provide: COOKIE_SERVICE,
      useClass: HttpCookieAdapter,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    // Use Cases
    LoginUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    // Strategy
    JwtStrategy,
  ],
  exports: [USER_REPOSITORY, TOKEN_SERVICE],
})
export class AuthModule {}
