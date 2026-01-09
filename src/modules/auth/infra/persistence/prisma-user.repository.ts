import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma';
import { IUserRepository, User, CreateUserData } from '../../application/ports';

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

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  async changePassword(userId: string, newPassword: string, isFirstAccess = false): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: newPassword,
        isFirstAccess,
      },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role as Role,
      },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isFirstAccess: true,
      },
    });
  }

  async updateName(userId: string, name: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }
}
