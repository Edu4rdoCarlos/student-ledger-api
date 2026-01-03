import { Defense as PrismaDefense, DefenseStudent } from '@prisma/client';
import { Defense } from '../../domain/entities';

type DefenseWithStudents = PrismaDefense & {
  students: DefenseStudent[];
};

export class DefenseMapper {
  static toDomain(prisma: DefenseWithStudents): Defense {
    return Defense.create(
      {
        titulo: prisma.titulo,
        dataDefesa: prisma.dataDefesa,
        notaFinal: prisma.notaFinal ?? undefined,
        resultado: prisma.resultado as 'PENDENTE' | 'APROVADO' | 'REPROVADO',
        advisorId: prisma.advisorId,
        studentIds: prisma.students.map((s) => s.studentId),
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      prisma.id,
    );
  }

  static toPrisma(defense: Defense) {
    return {
      id: defense.id,
      titulo: defense.titulo,
      dataDefesa: defense.dataDefesa,
      notaFinal: defense.notaFinal ?? null,
      resultado: defense.resultado,
      advisorId: defense.advisorId,
      createdAt: defense.createdAt,
      updatedAt: defense.updatedAt,
    };
  }
}
