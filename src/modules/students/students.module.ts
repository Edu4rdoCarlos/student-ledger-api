import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma';
import { AuthModule } from '../auth/auth.module';
import { FabricModule } from '../fabric/fabric.module';
import { CoursesModule } from '../courses/courses.module';
import { STUDENT_REPOSITORY } from './application/ports';
import { PrismaStudentRepository } from './infra/persistence';
import { StudentsController } from './presentation/http';
import {
  CreateStudentUseCase,
  GetStudentUseCase,
  ListStudentsUseCase,
  UpdateStudentUseCase,
} from './application/use-cases';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FabricModule,
    forwardRef(() => CoursesModule),
    forwardRef(() => require('../defenses/defenses.module').DefensesModule),
  ],
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
  ],
  exports: [STUDENT_REPOSITORY],
})
export class StudentsModule {}
