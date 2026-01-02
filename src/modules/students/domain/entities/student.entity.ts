export interface StudentProps {
  matricula: string;
  nome: string;
  email: string;
  courseId: string;
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Student {
  private readonly _id: string;
  private props: StudentProps;

  private constructor(props: StudentProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  static create(props: StudentProps, id?: string): Student {
    return new Student(
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

  get matricula(): string {
    return this.props.matricula;
  }

  get nome(): string {
    return this.props.nome;
  }

  get email(): string {
    return this.props.email;
  }

  get courseId(): string {
    return this.props.courseId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  updateEmail(email: string): void {
    this.props.email = email;
    this.props.updatedAt = new Date();
  }

  updateName(nome: string): void {
    this.props.nome = nome;
    this.props.updatedAt = new Date();
  }
}
