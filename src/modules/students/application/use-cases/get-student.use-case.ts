import { Inject, Injectable, Logger } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentNotFoundError } from '../../domain/errors';
import { StudentResponseDto, DefenseRecord } from '../../presentation/dtos';
import { IFabricGateway, FABRIC_GATEWAY, FabricUser } from '../../../fabric/application/ports';

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
  ) {}

  async execute(request: GetStudentRequest): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findByMatricula(request.matricula);

    if (!student) {
      throw new StudentNotFoundError(request.matricula);
    }

    let defenses: DefenseRecord[] = [];

    try {
      const fabricUser: FabricUser = {
        id: request.currentUser.id,
        email: request.currentUser.email,
        role: request.currentUser.role,
      };

      const blockchainRecords = await this.fabricGateway.getDocumentHistory(fabricUser, student.matricula);
      defenses = blockchainRecords.map(record => this.mapToDefenseRecord(record));
    } catch (error) {
      this.logger.warn(`Erro ao buscar defesas: ${error.message}`);
    }

    return StudentResponseDto.fromEntity(student, defenses);
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
      finalGrade: record.notaFinal,
      result: record.resultado === 'APROVADO' ? 'APPROVED' : 'FAILED',
      version: record.versao,
      reason: record.motivo || '',
      registeredBy: record.registeredBy,
      status: 'APPROVED',
      signatures: (record.signatures || []).map((sig: any) => ({
        role: roleMap[sig.role] || sig.role,
        email: sig.email,
        mspId: sig.mspId,
        timestamp: sig.timestamp,
        status: sig.status,
        justification: sig.justification,
      })),
      validatedAt: record.validatedAt,
    };
  }
}
