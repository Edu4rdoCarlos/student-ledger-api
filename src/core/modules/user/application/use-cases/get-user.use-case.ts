import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IUserRepository, USER_REPOSITORY, User } from '../../../auth/application/ports';
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
    const user = await this.findAndValidateUser(userId);
    const userResponse = this.buildBaseUserResponse(user);
    const metadata = await this.buildMetadata(userId, user.role);

    if (Object.keys(metadata).length > 0) {
      userResponse.metadata = metadata;
    }

    return userResponse;
  }

  private async findAndValidateUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  private buildBaseUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    };
  }

  private async buildMetadata(userId: string, role: string): Promise<UserMetadataDto> {
    const metadata: UserMetadataDto = {};

    if (role === Role.STUDENT) {
      metadata.student = await this.buildStudentMetadata(userId);
    } else if (role === Role.ADVISOR) {
      metadata.advisor = await this.buildAdvisorMetadata(userId);
    } else if (role === Role.COORDINATOR) {
      metadata.coordinator = await this.buildCoordinatorMetadata(userId);
    }

    return metadata;
  }

  private async buildStudentMetadata(userId: string) {
    const student = await this.studentRepository.findByUserId(userId);
    if (!student) return undefined;

    const [course, defenses] = await Promise.all([
      this.courseRepository.findById(student.courseId),
      this.defenseRepository.findByStudentId(student.id),
    ]);

    return {
      userId: student.id,
      registration: student.matricula,
      course: course ? CourseResponseDto.fromEntity(course) : undefined,
      defenses: defenses.map(DefenseResponseDto.fromEntity),
    };
  }

  private async buildAdvisorMetadata(userId: string) {
    const advisor = await this.advisorRepository.findByUserId(userId);
    if (!advisor) return undefined;

    const defenses = await this.defenseRepository.findByAdvisorId(advisor.id);

    return {
      userId: advisor.id,
      specialization: advisor.specialization,
      course: advisor.course ? CourseResponseDto.fromEntity(advisor.course) : undefined,
      defenses: defenses.map(DefenseResponseDto.fromEntity),
    };
  }

  private async buildCoordinatorMetadata(userId: string) {
    const coordinator = await this.coordinatorRepository.findByUserId(userId);
    if (!coordinator) return undefined;

    return {
      userId: coordinator.id,
      isActive: coordinator.isActive,
      course: coordinator.course ? CourseResponseDto.fromEntity(coordinator.course) : undefined,
    };
  }
}
