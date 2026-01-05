export interface DepartmentProps {
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Department {
  private readonly _id: string;
  private props: DepartmentProps;

  private constructor(props: DepartmentProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  static create(props: DepartmentProps, id?: string): Department {
    return new Department(
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

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(data: Partial<Pick<DepartmentProps, 'name'>>): void {
    if (data.name !== undefined) this.props.name = data.name;
    this.props.updatedAt = new Date();
  }
}
