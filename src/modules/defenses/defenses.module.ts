import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma';
import { StudentsModule } from '../students/students.module';
import { AdvisorsModule } from '../advisors/advisors.module';
import { DocumentsModule } from '../documents/documents.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import {
  CreateDefenseUseCase,
  GetDefenseUseCase,
  ListDefensesUseCase,
  UpdateDefenseUseCase,
  SubmitDefenseResultUseCase,
} from './application/use-cases';
import { DEFENSE_REPOSITORY } from './application/ports';
import { PrismaDefenseRepository } from './infra/persistence';
import { DefenseController } from './presentation/http';

@Module({
  imports: [PrismaModule, StudentsModule, AdvisorsModule, DocumentsModule, IpfsModule],
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
    SubmitDefenseResultUseCase,
  ],
  exports: [DEFENSE_REPOSITORY],
})
export class DefensesModule {}
