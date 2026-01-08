import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class CoordinatorCourseGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== Role.COORDINATOR) {
      return true;
    }

    if (!user.courseId) {
      throw new ForbiddenException('Coordenador não está associado a nenhum curso');
    }

    return true;
  }
}
