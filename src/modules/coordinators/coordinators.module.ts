import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma';
import { AuthModule } from '../auth/auth.module';
import { CoursesModule } from '../courses/courses.module';
import { COORDINATOR_REPOSITORY } from './application/ports';
import { PrismaCoordinatorRepository } from './infra/persistence';
import { CoordinatorsController } from './presentation/http';
import { CreateCoordinatorUseCase } from './application/use-cases';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => CoursesModule)],
  controllers: [CoordinatorsController],
  providers: [
    {
      provide: COORDINATOR_REPOSITORY,
      useClass: PrismaCoordinatorRepository,
    },
    CreateCoordinatorUseCase,
  ],
  exports: [COORDINATOR_REPOSITORY],
})
export class CoordinatorsModule {}
