import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coordinator: {
          select: {
            id: true,
            courses: {
              select: {
                id: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const courseId = user.coordinator?.courses?.[0]?.id;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      courseId,
    };
  }
}
