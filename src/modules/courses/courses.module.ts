import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma';
import { COURSE_REPOSITORY } from './application/ports';
import { PrismaCourseRepository } from './infra/persistence';
import { CoursesController } from './presentation/http';
import {
  CreateCourseUseCase,
  GetCourseUseCase,
  ListCoursesUseCase,
  UpdateCourseUseCase,
} from './application/use-cases';
import { DepartmentsModule } from '../departments/departments.module';
import { AdvisorsModule } from '../advisors/advisors.module';

@Module({
  imports: [PrismaModule, DepartmentsModule, AdvisorsModule],
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
  ],
  exports: [COURSE_REPOSITORY],
})
export class CoursesModule {}
