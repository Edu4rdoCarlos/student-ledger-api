import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma';
import { COURSE_REPOSITORY } from './application/ports';
import { PrismaCourseRepository } from './infra/persistence';
import { CoursesController } from './presentation/http';
import {
  CreateCourseUseCase,
  GetCourseUseCase,
  ListCoursesUseCase,
  UpdateCourseUseCase,
  ListCourseStudentsUseCase,
  ListCourseAdvisorsUseCase,
} from './application/use-cases';
import { CoordinatorsModule } from '../coordinators/coordinators.module';
import { StudentsModule } from '../students/students.module';
import { AdvisorsModule } from '../advisors/advisors.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => CoordinatorsModule),
    forwardRef(() => StudentsModule),
    forwardRef(() => AdvisorsModule),
    forwardRef(() => require('../defenses/defenses.module').DefensesModule),
  ],
  controllers: [CoursesController],
  providers: [
    {
      provide: COURSE_REPOSITORY,
      useClass: PrismaCourseRepository,
    },
    CreateCourseUseCase,
    GetCourseUseCase,
    ListCoursesUseCase,
    UpdateCourseUseCase,
    ListCourseStudentsUseCase,
    ListCourseAdvisorsUseCase,
  ],
  exports: [COURSE_REPOSITORY],
})
export class CoursesModule {}
