import { DefenseResult, DefenseStatus } from '@prisma/client';

export { DefenseResult, DefenseStatus };

export interface AdvisorInDefense {
  id: string;
  name: string;
  email?: string;
  specialization?: string;
  isActive: boolean;
}

export interface StudentInDefense {
  id: string;
  name: string;
  email?: string;
  registration?: string;
  course?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface DocumentInDefense {
  id: string;
  version: number;
  minutesHash?: string;
  minutesCid?: string;
  evaluationHash?: string;
  evaluationCid?: string;
  status: string;
  changeReason?: string;
  blockchainTxId?: string;
  blockchainRegisteredAt?: Date;
  defenseId: string;
  previousVersionId?: string;
  createdAt: Date;
  updatedAt: Date;
  approvals?: Array<{
    role: string;
    status: string;
    approvedAt?: Date;
    justification?: string;
    approverId?: string;
    approver?: {
      name: string;
      email: string;
      role: string;
    };
  }>;
}

export interface ExamBoardMember {
  id?: string;
  name: string;
  email: string;
}

export interface DefenseProps {
  title: string;
  defenseDate: Date;
  location?: string;
  finalGrade?: number;
  result: DefenseResult;
  status: DefenseStatus;
  advisorId: string;
  studentIds: string[];
  examBoard?: ExamBoardMember[];
  advisor?: AdvisorInDefense;
  students?: StudentInDefense[];
  documents?: DocumentInDefense[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Defense {
  private readonly _id: string;
  private props: DefenseProps;

  private constructor(props: DefenseProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  static create(props: DefenseProps, id?: string): Defense {
    if (props.studentIds.length === 0) {
      throw new Error('Defesa deve ter pelo menos 1 estudante');
    }
    if (props.studentIds.length > 2) {
      throw new Error('Defesa pode ter no máximo 2 estudantes');
    }

    return new Defense(
      {
        ...props,
        result: props.result ?? DefenseResult.PENDING,
        status: props.status ?? DefenseStatus.SCHEDULED,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get id(): string {
    return this._id;
  }

  get title(): string {
    return this.props.title;
  }

  get defenseDate(): Date {
    return this.props.defenseDate;
  }

  get location(): string | undefined {
    return this.props.location;
  }

  get finalGrade(): number | undefined {
    return this.props.finalGrade;
  }

  get result(): DefenseResult {
    return this.props.result;
  }

  get status(): DefenseStatus {
    return this.props.status;
  }

  get examBoard(): ExamBoardMember[] | undefined {
    return this.props.examBoard;
  }

  get advisorId(): string {
    return this.props.advisorId;
  }

  get studentIds(): string[] {
    return this.props.studentIds;
  }

  get advisor(): AdvisorInDefense | undefined {
    return this.props.advisor;
  }

  get students(): StudentInDefense[] | undefined {
    return this.props.students;
  }

  get documents(): DocumentInDefense[] | undefined {
    return this.props.documents;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  setGrade(grade: number): void {
    if (grade < 0 || grade > 10) {
      throw new Error('A nota deve estar entre 0 e 10');
    }

    this.props.finalGrade = grade;
    this.props.result = grade >= 7 ? DefenseResult.APPROVED : DefenseResult.FAILED;
    this.props.status = DefenseStatus.COMPLETED;
    this.props.updatedAt = new Date();
  }

  changeTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  changeLocation(location: string): void {
    this.props.location = location;
    this.props.updatedAt = new Date();
  }

  changeDefenseDate(date: Date): void {
    this.props.defenseDate = date;
    this.props.updatedAt = new Date();
  }

  updateExamBoard(members: ExamBoardMember[]): void {
    this.props.examBoard = members;
    this.props.updatedAt = new Date();
  }

  isCompleted(): boolean {
    return this.props.status === DefenseStatus.COMPLETED;
  }

  isCanceled(): boolean {
    return this.props.status === DefenseStatus.CANCELED;
  }

  isScheduled(): boolean {
    return this.props.status === DefenseStatus.SCHEDULED;
  }

  cancel(reason: string): void {
    if (this.isCompleted()) {
      throw new Error('Não é possível cancelar uma defesa já concluída');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Motivo do cancelamento é obrigatório');
    }
    this.props.status = DefenseStatus.CANCELED;
    this.props.result = DefenseResult.FAILED;
    this.props.finalGrade = 0;
    this.props.updatedAt = new Date();
  }

  reschedule(newDate: Date, reason: string): void {
    if (this.isCompleted()) {
      throw new Error('Não é possível reagendar uma defesa já concluída');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Motivo do reagendamento é obrigatório');
    }
    this.props.defenseDate = newDate;
    this.props.updatedAt = new Date();
  }
}
