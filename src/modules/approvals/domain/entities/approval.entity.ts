export enum ApprovalRole {
  COORDINATOR = 'COORDINATOR',
  ADVISOR = 'ADVISOR',
  STUDENT = 'STUDENT',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

interface ApprovalProps {
  id?: string;
  role: ApprovalRole;
  status?: ApprovalStatus;
  justification?: string;
  approvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  documentId: string;
  approverId?: string;
}

export class Approval {
  private constructor(private props: ApprovalProps) {}

  static create(data: ApprovalProps): Approval {
    return new Approval({
      ...data,
      status: data.status || ApprovalStatus.PENDING,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    });
  }

  approve(approverId: string): void {
    if (this.props.status !== ApprovalStatus.PENDING) {
      throw new Error('Apenas aprovações pendentes podem ser aprovadas');
    }
    this.props.status = ApprovalStatus.APPROVED;
    this.props.approverId = approverId;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reject(approverId: string, justification: string): void {
    if (this.props.status !== ApprovalStatus.PENDING) {
      throw new Error('Apenas aprovações pendentes podem ser rejeitadas');
    }
    if (!justification || justification.trim().length === 0) {
      throw new Error('Justificativa é obrigatória para rejeição');
    }
    this.props.status = ApprovalStatus.REJECTED;
    this.props.approverId = approverId;
    this.props.justification = justification;
    this.props.updatedAt = new Date();
  }

  resetToPending(): void {
    if (this.props.status !== ApprovalStatus.REJECTED) {
      throw new Error('Apenas aprovações rejeitadas podem ser resetadas para pendente');
    }
    this.props.status = ApprovalStatus.PENDING;
    this.props.justification = undefined;
    this.props.approvedAt = undefined;
    this.props.updatedAt = new Date();
  }

  resetForNewVersion(): void {
    this.props.status = ApprovalStatus.PENDING;
    this.props.justification = undefined;
    this.props.approvedAt = undefined;
    this.props.updatedAt = new Date();
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get role(): ApprovalRole {
    return this.props.role;
  }

  get status(): ApprovalStatus {
    return this.props.status!;
  }

  get justification(): string | undefined {
    return this.props.justification;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get documentId(): string {
    return this.props.documentId;
  }

  get approverId(): string | undefined {
    return this.props.approverId;
  }
}
