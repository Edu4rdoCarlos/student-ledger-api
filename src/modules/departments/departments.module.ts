import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma';
import { DepartmentsController } from './presentation/http/departments.controller';
import {
  GetDepartmentUseCase,
  ListDepartmentsUseCase,
  UpdateDepartmentUseCase,
} from './application/use-cases';
import { DEPARTMENT_REPOSITORY } from './application/ports';
import { PrismaDepartmentRepository } from './infra/persistence';

@Module({
  imports: [PrismaModule],
  controllers: [DepartmentsController],
  providers: [
    GetDepartmentUseCase,
    ListDepartmentsUseCase,
    UpdateDepartmentUseCase,
    {
      provide: DEPARTMENT_REPOSITORY,
      useClass: PrismaDepartmentRepository,
    },
  ],
  exports: [DEPARTMENT_REPOSITORY],
})
export class DepartmentsModule {}
