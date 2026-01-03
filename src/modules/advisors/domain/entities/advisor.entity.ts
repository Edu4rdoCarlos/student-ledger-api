export interface AdvisorProps {
  userId: string;
  departamento?: string;
  specialization?: string;
  courseId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Advisor {
  private readonly _id: string;
  private props: AdvisorProps;

  private constructor(props: AdvisorProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  static create(props: AdvisorProps, id?: string): Advisor {
    return new Advisor(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get departamento(): string | undefined {
    return this.props.departamento;
  }

  get specialization(): string | undefined {
    return this.props.specialization;
  }

  get courseId(): string | undefined {
    return this.props.courseId;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(data: Partial<Pick<AdvisorProps, 'departamento' | 'specialization' | 'courseId'>>): void {
    if (data.departamento !== undefined) this.props.departamento = data.departamento;
    if (data.specialization !== undefined) this.props.specialization = data.specialization;
    if (data.courseId !== undefined) this.props.courseId = data.courseId;
    this.props.updatedAt = new Date();
  }
}
