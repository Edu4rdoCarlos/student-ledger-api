import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma';
import { AuthModule } from '../auth/auth.module';
import { CoursesModule } from '../courses/courses.module';
import { CoordinatorsModule } from '../coordinators/coordinators.module';
import { ADVISOR_REPOSITORY } from './application/ports';
import { PrismaAdvisorRepository } from './infra/persistence';
import { AdvisorsController } from './presentation/http';
import {
  CreateAdvisorUseCase,
  GetAdvisorUseCase,
  ListAdvisorsUseCase,
  UpdateAdvisorUseCase,
} from './application/use-cases';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => CoursesModule), forwardRef(() => CoordinatorsModule)],
  controllers: [AdvisorsController],
  providers: [
    {
      provide: ADVISOR_REPOSITORY,
      useClass: PrismaAdvisorRepository,
    },
    CreateAdvisorUseCase,
    GetAdvisorUseCase,
    ListAdvisorsUseCase,
    UpdateAdvisorUseCase,
  ],
  exports: [ADVISOR_REPOSITORY],
})
export class AdvisorsModule {}
