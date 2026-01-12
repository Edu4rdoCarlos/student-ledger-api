import { ApiProperty } from '@nestjs/swagger';
import { Advisor } from '../../../domain/entities';

class CourseInfo {
  @ApiProperty({ description: 'ID do curso' })
  id: string;

  @ApiProperty({ description: 'Código do curso' })
  code: string;

  @ApiProperty({ description: 'Nome do curso' })
  name: string;
}

class ExamBoardMemberInfo {
  @ApiProperty({ description: 'ID do membro da banca' })
  id: string;

  @ApiProperty({ description: 'Nome do membro da banca' })
  name: string;

  @ApiProperty({ description: 'Email do membro da banca' })
  email: string;
}

class StudentInfo {
  @ApiProperty({ description: 'ID do estudante' })
  id: string;

  @ApiProperty({ description: 'Nome do estudante' })
  name: string;

  @ApiProperty({ required: false, description: 'Email do estudante' })
  email?: string;

  @ApiProperty({ required: false, description: 'Matrícula do estudante' })
  registration?: string;
}

class DefenseInfo {
  @ApiProperty({ description: 'ID da defesa' })
  id: string;

  @ApiProperty({ description: 'Título da defesa' })
  title: string;

  @ApiProperty({ description: 'Data da defesa' })
  defenseDate: Date;

  @ApiProperty({ required: false, description: 'Local da defesa' })
  location?: string;

  @ApiProperty({ required: false, description: 'Nota final' })
  finalGrade?: number;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'FAILED'], description: 'Resultado da defesa' })
  result: string;

  @ApiProperty({ enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'], description: 'Status da defesa' })
  status: string;

  @ApiProperty({ type: [StudentInfo], description: 'Estudantes da defesa' })
  students: StudentInfo[];

  @ApiProperty({ required: false, type: [ExamBoardMemberInfo], description: 'Banca examinadora' })
  examBoard?: ExamBoardMemberInfo[];

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export class AdvisorResponseDto {
  @ApiProperty({ description: 'ID do usuário do orientador' })
  userId: string;

  @ApiProperty({ description: 'Nome do orientador' })
  name: string;

  @ApiProperty({ description: 'Email do orientador' })
  email: string;

  @ApiProperty({ description: 'Área de especialização' })
  specialization: string;

  @ApiProperty({ required: false, type: CourseInfo, description: 'Informações do curso' })
  course?: CourseInfo;

  @ApiProperty({ description: 'Indica se possui orientações ativas' })
  hasActiveAdvisorship: boolean;

  @ApiProperty({ description: 'Quantidade de orientações ativas' })
  activeAdvisorshipsCount: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiProperty({ required: false, type: [DefenseInfo], description: 'Lista de orientações de TCC' })
  defenses?: DefenseInfo[];

  static fromEntity(advisor: Advisor, activeAdvisorshipsCount?: number): AdvisorResponseDto {
    const dto = new AdvisorResponseDto();
    dto.userId = advisor.id;
    dto.name = advisor.name;
    dto.email = advisor.email;
    dto.specialization = advisor.specialization;
    dto.createdAt = advisor.createdAt!;
    dto.updatedAt = advisor.updatedAt!;

    dto.activeAdvisorshipsCount = activeAdvisorshipsCount ?? 0;
    dto.hasActiveAdvisorship = dto.activeAdvisorshipsCount > 0;

    if (advisor.course) {
      dto.course = {
        id: advisor.course.id,
        code: advisor.course.code,
        name: advisor.course.name,
      };
    }

    if (advisor.defenses) {
      dto.defenses = advisor.defenses.map(defense => ({
        id: defense.id,
        title: defense.title,
        defenseDate: defense.defenseDate,
        location: defense.location,
        finalGrade: defense.finalGrade,
        result: defense.result,
        status: defense.status,
        students: defense.students?.map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          registration: student.registration,
        })) || [],
        examBoard: defense.examBoard?.map(member => ({
          id: member.id!,
          name: member.name,
          email: member.email,
        })),
        createdAt: defense.createdAt,
        updatedAt: defense.updatedAt,
      }));
    }

    return dto;
  }
}
