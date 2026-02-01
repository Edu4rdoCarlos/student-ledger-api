import { Injectable, Inject, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../ports';
import { ApprovalRole, ApprovalStatus } from '../../domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { CertificateQueueService } from '../../../../toolkit/fabric/application/services/certificate-queue.service';
import { CertificateManagementService } from '../../../../toolkit/fabric/application/services/certificate-management.service';

@Injectable()
export class ResetApprovalsForNewVersionUseCase {
  private readonly logger = new Logger(ResetApprovalsForNewVersionUseCase.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    private readonly certificateQueue: CertificateQueueService,
    private readonly certificateManagement: CertificateManagementService,
  ) {}

  async execute(documentId: string): Promise<void> {
    this.logger.log(`Resetando aprovações do documento ${documentId}`);

    const approvals = await this.approvalRepository.findByDocumentId(documentId);

    for (const approval of approvals) {
      if (approval.id && approval.status !== ApprovalStatus.PENDING) {
        await this.revokeCertificateAndGenerateNew(approval.id, approval.approverId, approval.role);

        approval.resetForNewVersion();
        await this.approvalRepository.update(approval);
      }
    }
  }

  private async revokeCertificateAndGenerateNew(
    approvalId: string,
    approverId: string | undefined,
    role: ApprovalRole,
  ): Promise<void> {
    if (!approverId) {
      this.logger.warn(`Aprovação ${approvalId} sem approverId, pulando regeneração de certificado`);
      return;
    }

    if (role === ApprovalRole.COORDINATOR) {
      this.logger.log(`Coordenador usa certificado base, não regenerando para approval ${approvalId}`);
      return;
    }

    try {
      await this.certificateManagement.revokeCertificateByApprovalId(
        approvalId,
        'Documento atualizado - nova versão enviada',
        'system',
      );
    } catch (error) {
      this.logger.warn(`Falha ao revogar certificado para approval ${approvalId}: ${error.message}`);
    }

    const userInfo = await this.getUserInfoForCertificate(approverId, role);
    if (!userInfo) {
      this.logger.error(`Não foi possível obter informações do usuário ${approverId} para gerar certificado`);
      return;
    }

    this.certificateQueue.enqueueCertificateGeneration(
      approverId,
      userInfo.email,
      userInfo.prismaRole,
      approvalId,
    ).catch(error => {
      this.logger.error(`Falha ao enfileirar novo certificado para approval ${approvalId}: ${error.message}`);
    });
  }

  private async getUserInfoForCertificate(
    userId: string,
    role: ApprovalRole,
  ): Promise<{ email: string; prismaRole: Role } | null> {
    switch (role) {
      case ApprovalRole.STUDENT: {
        const student = await this.studentRepository.findById(userId);
        return student ? { email: student.email, prismaRole: Role.STUDENT } : null;
      }
      case ApprovalRole.ADVISOR: {
        const advisor = await this.advisorRepository.findById(userId);
        return advisor ? { email: advisor.email, prismaRole: Role.ADVISOR } : null;
      }
      case ApprovalRole.COORDINATOR: {
        const coordinator = await this.coordinatorRepository.findById(userId);
        return coordinator ? { email: coordinator.email, prismaRole: Role.COORDINATOR } : null;
      }
      default:
        return null;
    }
  }
}
