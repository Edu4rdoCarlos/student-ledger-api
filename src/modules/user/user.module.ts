import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StudentsModule } from '../students/students.module';
import { AdvisorsModule } from '../advisors/advisors.module';
import { CoordinatorsModule } from '../coordinators/coordinators.module';
import { UserController } from './presentation/http';
import { ChangePasswordUseCase, GetUserUseCase } from './application/use-cases';

@Module({
  imports: [AuthModule, StudentsModule, AdvisorsModule, CoordinatorsModule],
  controllers: [UserController],
  providers: [ChangePasswordUseCase, GetUserUseCase],
})
export class UserModule {}
