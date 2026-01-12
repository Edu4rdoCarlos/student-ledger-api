import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { DEFENSE_REPOSITORY, IDefenseRepository } from '../../../defenses/application/ports';
import { UserResponseDto, UserMetadataDto } from '../../presentation/dtos';
import { CourseResponseDto } from '../../../courses/presentation/dtos';
import { DefenseResponseDto } from '../../../defenses/presentation/dtos/response/defense-response.dto';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT',
    };

    const metadata: UserMetadataDto = {};

    if (user.role === 'STUDENT') {
      const student = await this.studentRepository.findByUserId(userId);
      if (student) {
        const [course, defenses] = await Promise.all([
          this.courseRepository.findById(student.courseId),
          this.defenseRepository.findByStudentId(student.id),
        ]);

        metadata.student = {
          userId: student.id,
          registration: student.matricula,
          course: course ? CourseResponseDto.fromEntity(course) : undefined,
          defenses: defenses.map(DefenseResponseDto.fromEntity),
        };
      }
    } else if (user.role === 'ADVISOR') {
      const advisor = await this.advisorRepository.findByUserId(userId);
      if (advisor) {
        const defenses = await this.defenseRepository.findByAdvisorId(advisor.id);

        metadata.advisor = {
          userId: advisor.id,
          specialization: advisor.specialization,
          course: advisor.course ? CourseResponseDto.fromEntity(advisor.course) : undefined,
          defenses: defenses.map(DefenseResponseDto.fromEntity),
        };
      }
    } else if (user.role === 'COORDINATOR') {
      const coordinator = await this.coordinatorRepository.findByUserId(userId);
      if (coordinator) {
        const course = coordinator.course;

        metadata.coordinator = {
          userId: coordinator.id,
          isActive: coordinator.isActive,
          course: course ? CourseResponseDto.fromEntity(course) : undefined,
        };
      }
    }

    if (Object.keys(metadata).length > 0) {
      userResponse.metadata = metadata;
    }

    return userResponse;
  }
}
