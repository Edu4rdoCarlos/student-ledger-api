import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StudentsModule } from '../students/students.module';
import { AdvisorsModule } from '../advisors/advisors.module';
import { CoordinatorsModule } from '../coordinators/coordinators.module';
import { ProfileController } from './presentation/http';
import { ChangePasswordUseCase, GetProfileUseCase } from './application/use-cases';

@Module({
  imports: [AuthModule, StudentsModule, AdvisorsModule, CoordinatorsModule],
  controllers: [ProfileController],
  providers: [ChangePasswordUseCase, GetProfileUseCase],
})
export class ProfileModule {}
