import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma';
import { IUserRepository, User } from '../../application/ports';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      },
    });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      },
    });
  }
}
