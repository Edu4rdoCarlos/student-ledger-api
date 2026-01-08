import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { ProfileResponseDto, ProfileMetadataDto } from '../../presentation/dtos';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
  ) {}

  async execute(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const profile: ProfileResponseDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT',
    };

    const metadata: ProfileMetadataDto = {};

    if (user.role === 'STUDENT') {
      const student = await this.studentRepository.findByUserId(userId);
      if (student) {
        metadata.student = {
          id: student.id,
          registration: student.matricula,
          courseId: student.courseId,
        };
      }
    } else if (user.role === 'ADVISOR') {
      const advisor = await this.advisorRepository.findByUserId(userId);
      if (advisor) {
        metadata.advisor = {
          id: advisor.id,
          departmentId: advisor.departmentId,
          specialization: advisor.specialization,
          courseId: advisor.courseId,
        };
      }
    } else if (user.role === 'COORDINATOR') {
      const coordinator = await this.coordinatorRepository.findByUserId(userId);
      if (coordinator) {
        metadata.coordinator = {
          id: coordinator.id,
          courseId: coordinator.courseId,
          isActive: coordinator.isActive,
        };
      }
    }

    if (Object.keys(metadata).length > 0) {
      profile.metadata = metadata;
    }

    return profile;
  }
}
