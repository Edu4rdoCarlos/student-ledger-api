import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma';
import { StudentsModule } from '../students/students.module';
import { AdvisorsModule } from '../advisors/advisors.module';
import {
  CreateDefenseUseCase,
  GetDefenseUseCase,
  ListDefensesUseCase,
  UpdateDefenseUseCase,
  SetGradeUseCase,
} from './application/use-cases';
import { DEFENSE_REPOSITORY } from './application/ports';
import { PrismaDefenseRepository } from './infra/persistence';
import { DefenseController } from './presentation/http';

@Module({
  imports: [PrismaModule, StudentsModule, AdvisorsModule],
  controllers: [DefenseController],
  providers: [
    {
      provide: DEFENSE_REPOSITORY,
      useClass: PrismaDefenseRepository,
    },
    CreateDefenseUseCase,
    GetDefenseUseCase,
    ListDefensesUseCase,
    UpdateDefenseUseCase,
    SetGradeUseCase,
  ],
  exports: [DEFENSE_REPOSITORY],
})
export class DefensesModule {}
