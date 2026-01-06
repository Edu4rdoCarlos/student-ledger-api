import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma';
import { AuthModule } from '../auth/auth.module';
import { FabricModule } from '../fabric/fabric.module';
import { STUDENT_REPOSITORY } from './application/ports';
import { PrismaStudentRepository } from './infra/persistence';
import { StudentsController } from './presentation/http';
import {
  CreateStudentUseCase,
  GetStudentUseCase,
  ListStudentsUseCase,
  UpdateStudentUseCase,
  ChangePasswordUseCase,
} from './application/use-cases';

@Module({
  imports: [PrismaModule, AuthModule, FabricModule],
  controllers: [StudentsController],
  providers: [
    {
      provide: STUDENT_REPOSITORY,
      useClass: PrismaStudentRepository,
    },
    CreateStudentUseCase,
    GetStudentUseCase,
    ListStudentsUseCase,
    UpdateStudentUseCase,
    ChangePasswordUseCase,
  ],
  exports: [STUDENT_REPOSITORY],
})
export class StudentsModule {}
