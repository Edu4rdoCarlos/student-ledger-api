export interface StudentProps {
  matricula: string;
  userId: string;
  courseId: string;
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

  get userId(): string {
    return this.props.userId;
  }

  get courseId(): string {
    return this.props.courseId;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  updateCourse(courseId: string): void {
    this.props.courseId = courseId;
    this.props.updatedAt = new Date();
  }
}
