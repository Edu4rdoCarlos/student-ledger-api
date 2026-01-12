import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentNotFoundError } from '../../domain/errors';
import { StudentResponseDto, DefenseRecord } from '../../presentation/dtos';
import { IFabricGateway, FABRIC_GATEWAY, FabricUser } from '../../../fabric/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';

export interface GetStudentRequest {
  matricula: string;
  currentUser: {
    id: string;
    email: string;
    role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';
  };
}

@Injectable()
export class GetStudentUseCase {
  private readonly logger = new Logger(GetStudentUseCase.name);

  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(FABRIC_GATEWAY)
    private readonly fabricGateway: IFabricGateway,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(request: GetStudentRequest): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findByMatricula(request.matricula);

    if (!student) {
      throw new StudentNotFoundError(request.matricula);
    }

    const course = await this.courseRepository.findById(student.courseId);

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const dbDefenses = await this.defenseRepository.findByStudentId(student.id);
    let defenses: DefenseRecord[] = [];

    try {
      const fabricUser: FabricUser = {
        id: request.currentUser.id,
        email: request.currentUser.email,
        role: request.currentUser.role,
      };

      // Tentar buscar defesas do blockchain
      const blockchainRecords = await this.fabricGateway.getDocumentHistory(fabricUser, student.matricula);

      if (blockchainRecords && blockchainRecords.length > 0) {
        // Blockchain tem dados - usar como fonte de verdade
        defenses = blockchainRecords.map(record => this.mapToDefenseRecord(record));

        // Comparar com dados do DB e logar inconsistências
        this.compareDefensesWithDB(defenses, dbDefenses, student.matricula);
      } else {
        // Blockchain vazio - usar dados do DB
        defenses = this.mapDBDefensesToRecords(dbDefenses, student.id);
      }
    } catch (error) {
      // Erro ao acessar blockchain - usar dados do DB
      this.logger.warn(
        `Erro ao buscar defesas do blockchain para matrícula ${student.matricula}: ${error.message}. Usando dados do banco.`
      );
      defenses = this.mapDBDefensesToRecords(dbDefenses, student.id);
    }

    return {
      userId: student.id,
      registration: student.matricula,
      name: student.name,
      email: student.email,
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      createdAt: student.createdAt!,
      updatedAt: student.updatedAt!,
      defenses,
    };
  }

  private mapToDefenseRecord(record: any): DefenseRecord {
    const roleMap: Record<string, string> = {
      coordenador: 'coordinator',
      orientador: 'advisor',
      aluno: 'student',
    };

    return {
      documentId: record.documentId,
      ipfsCid: record.ipfsCid,
      studentRegistration: record.matricula,
      title: record.titulo || '',
      defenseDate: record.defenseDate,
      location: record.location || record.local,
      finalGrade: record.notaFinal,
      result: record.resultado === 'APROVADO' ? 'APPROVED' : 'FAILED',
      version: record.versao,
      reason: record.motivo || '',
      registeredBy: record.registeredBy,
      defenseStatus: 'COMPLETED',
      documentStatus: 'APPROVED',
      examBoard: record.examBoard || record.bancaExaminadora,
      signatures: (record.signatures || []).map((sig: any) => ({
        role: roleMap[sig.role] || sig.role,
        email: sig.email,
        timestamp: sig.timestamp,
        status: sig.status,
        justification: sig.justification,
      })),
      validatedAt: record.validatedAt,
    };
  }

  private mapDBDefensesToRecords(dbDefenses: any[], currentStudentId?: string): DefenseRecord[] {
    const mapped = dbDefenses.map((defense) => {
      const approvedDoc = defense.documents?.find((doc: any) => doc.status === 'APPROVED');
      const latestDoc = defense.documents?.[0];
      const doc = approvedDoc || latestDoc;

      const coStudents = defense.students
        ?.filter((s: any) => s.id !== currentStudentId)
        .map((s: any) => ({
          id: s.id,
          registration: s.registration,
          name: s.name,
          email: s.email,
        })) || [];

      return {
        documentId: doc?.id || '',
        ipfsCid: doc?.documentCid || '',
        studentRegistration: defense.students?.[0]?.registration || '',
        title: defense.title,
        defenseDate: defense.defenseDate.toISOString(),
        location: defense.location,
        finalGrade: defense.finalGrade || 0,
        result: defense.result as 'APPROVED' | 'FAILED',
        version: doc?.version || 1,
        reason: '',
        registeredBy: defense.advisor?.email || '',
        defenseStatus: defense.status,
        documentStatus: doc?.status || 'PENDING',
        advisor: defense.advisor ? {
          id: defense.advisor.id,
          name: defense.advisor.name,
          email: defense.advisor.email,
          specialization: defense.advisor.specialization,
        } : undefined,
        examBoard: defense.examBoard?.map((member: any) => ({
          name: member.name,
          email: member.email,
        })),
        coStudents: coStudents.length > 0 ? coStudents : undefined,
        signatures: [],
        validatedAt: doc?.blockchainRegisteredAt?.toISOString() || defense.updatedAt.toISOString(),
      };
    });

    return mapped;
  }

  private compareDefensesWithDB(
    blockchainDefenses: DefenseRecord[],
    dbDefenses: any[],
    matricula: string,
  ): void {
    const dbDefensesCount = dbDefenses.filter(d =>
      d.documents?.some((doc: any) => doc.status === 'APPROVED')
    ).length;

    if (blockchainDefenses.length !== dbDefensesCount) {
      this.logger.warn(
        `Inconsistência detectada para matrícula ${matricula}: ` +
        `Blockchain tem ${blockchainDefenses.length} defesa(s), ` +
        `DB tem ${dbDefensesCount} defesa(s) com documentos aprovados`
      );
    }

    blockchainDefenses.forEach(bcDefense => {
      const dbDefense = dbDefenses.find(d => d.title === bcDefense.title);

      if (!dbDefense) {
        this.logger.warn(
          `Defesa "${bcDefense.title}" existe no blockchain mas não foi encontrada no DB ` +
          `para matrícula ${matricula}`
        );
      } else if (dbDefense.finalGrade !== bcDefense.finalGrade) {
        this.logger.warn(
          `Nota divergente para defesa "${bcDefense.title}" (matrícula ${matricula}): ` +
          `Blockchain=${bcDefense.finalGrade}, DB=${dbDefense.finalGrade}`
        );
      }
    });
  }
}
