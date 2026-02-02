import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma';
import { IRefreshTokenRepository, RefreshTokenData } from '../../application/ports';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenData> {
    return this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async findByToken(token: string): Promise<RefreshTokenData | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async revokeByToken(token: string): Promise<void> {
    const exists = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (exists) {
      await this.prisma.refreshToken.update({
        where: { token },
        data: { revokedAt: new Date() },
      });
    }
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}
