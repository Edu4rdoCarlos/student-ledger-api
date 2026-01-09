export interface Department {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
}

export interface AdvisorProps {
  userId: string;
  departmentId?: string;
  department?: Department;
  specialization?: string;
  courseId?: string;
  course?: Course;
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

  get departmentId(): string | undefined {
    return this.props.departmentId;
  }

  get department(): Department | undefined {
    return this.props.department;
  }

  get specialization(): string | undefined {
    return this.props.specialization;
  }

  get courseId(): string | undefined {
    return this.props.courseId;
  }

  get course(): Course | undefined {
    return this.props.course;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(data: Partial<Pick<AdvisorProps, 'departmentId' | 'specialization' | 'courseId'>>): void {
    if (data.departmentId !== undefined) this.props.departmentId = data.departmentId;
    if (data.specialization !== undefined) this.props.specialization = data.specialization;
    if (data.courseId !== undefined) this.props.courseId = data.courseId;
    this.props.updatedAt = new Date();
  }
}
