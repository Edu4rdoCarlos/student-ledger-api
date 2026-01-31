import { ApiProperty } from '@nestjs/swagger';
import { Defense } from '../../../domain/entities';

class CourseInDefenseListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}

export class DefenseListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  defenseDate: Date;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'FAILED'] })
  result: string;

  @ApiProperty({ enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'] })
  status: string;

  @ApiProperty({ description: 'Nome do orientador' })
  advisorName: string;

  @ApiProperty({ description: 'Nomes dos estudantes', type: [String] })
  studentNames: string[];

  @ApiProperty({ description: 'Curso da defesa', type: CourseInDefenseListDto })
  course: CourseInDefenseListDto;

  static fromEntity(defense: Defense): DefenseListItemDto {
    const firstStudent = defense.students?.[0];
    const course = firstStudent?.course || { id: '', code: '', name: '' };

    return {
      id: defense.id,
      title: defense.title,
      defenseDate: defense.defenseDate,
      result: defense.result,
      status: defense.status,
      advisorName: defense.advisor?.name || '',
      studentNames: defense.students?.map(s => s.name) || [],
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
      },
    };
  }
}
