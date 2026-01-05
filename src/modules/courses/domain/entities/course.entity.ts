export interface CourseProps {
  codigo: string;
  nome: string;
  departmentId?: string;
  ativo: boolean;
  coordinatorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Course {
  private readonly _id: string;
  private props: CourseProps;

  private constructor(props: CourseProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  static create(props: CourseProps, id?: string): Course {
    return new Course(
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

  get codigo(): string {
    return this.props.codigo;
  }

  get nome(): string {
    return this.props.nome;
  }

  get departmentId(): string | undefined {
    return this.props.departmentId;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get coordinatorId(): string | undefined {
    return this.props.coordinatorId;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(data: Partial<Pick<CourseProps, 'nome' | 'departmentId' | 'ativo' | 'coordinatorId'>>): void {
    if (data.nome !== undefined) this.props.nome = data.nome;
    if (data.departmentId !== undefined) this.props.departmentId = data.departmentId;
    if (data.ativo !== undefined) this.props.ativo = data.ativo;
    if (data.coordinatorId !== undefined) this.props.coordinatorId = data.coordinatorId;
    this.props.updatedAt = new Date();
  }
}
