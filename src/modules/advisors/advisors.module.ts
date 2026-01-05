import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma';
import { AuthModule } from '../auth/auth.module';
import { ADVISOR_REPOSITORY } from './application/ports';
import { PrismaAdvisorRepository } from './infra/persistence';
import { AdvisorsController } from './presentation/http';
import {
  CreateAdvisorUseCase,
  GetAdvisorUseCase,
  ListAdvisorsUseCase,
  UpdateAdvisorUseCase,
  ChangePasswordUseCase,
} from './application/use-cases';

@Module({
  imports: [PrismaModule, AuthModule],
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
    ChangePasswordUseCase,
  ],
  exports: [ADVISOR_REPOSITORY],
})
export class AdvisorsModule {}
