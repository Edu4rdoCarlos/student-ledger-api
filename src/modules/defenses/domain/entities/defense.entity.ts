export interface DefenseProps {
  title: string;
  defenseDate: Date;
  finalGrade?: number;
  result: 'PENDING' | 'APPROVED' | 'FAILED';
  advisorId: string;
  studentIds: string[];
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
        result: props.result ?? 'PENDING',
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

  get finalGrade(): number | undefined {
    return this.props.finalGrade;
  }

  get result(): 'PENDING' | 'APPROVED' | 'FAILED' {
    return this.props.result;
  }

  get advisorId(): string {
    return this.props.advisorId;
  }

  get studentIds(): string[] {
    return this.props.studentIds;
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
    this.props.result = grade >= 7 ? 'APPROVED' : 'FAILED';
    this.props.updatedAt = new Date();
  }

  update(data: Partial<Pick<DefenseProps, 'title' | 'defenseDate'>>): void {
    if (data.title !== undefined) this.props.title = data.title;
    if (data.defenseDate !== undefined) this.props.defenseDate = data.defenseDate;
    this.props.updatedAt = new Date();
  }
}
