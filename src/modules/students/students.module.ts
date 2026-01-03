import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma';
import { STUDENT_REPOSITORY } from './application/ports';
import { PrismaStudentRepository } from './infra/persistence';
import { StudentsController } from './presentation/http';
import {
  CreateStudentUseCase,
  GetStudentUseCase,
  ListStudentsUseCase,
} from './application/use-cases';

@Module({
  imports: [PrismaModule],
  controllers: [StudentsController],
  providers: [
    // Repository
    {
      provide: STUDENT_REPOSITORY,
      useClass: PrismaStudentRepository,
    },
    // Use Cases
    CreateStudentUseCase,
    GetStudentUseCase,
    ListStudentsUseCase,
  ],
  exports: [STUDENT_REPOSITORY],
})
export class StudentsModule {}
