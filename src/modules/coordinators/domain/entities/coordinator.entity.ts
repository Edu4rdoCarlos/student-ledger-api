export interface CoordinatorProps {
  userId: string;
  courseId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Coordinator {
  private readonly _id: string;
  private props: CoordinatorProps;

  private constructor(props: CoordinatorProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = {
      ...props,
      isActive: props.isActive ?? true,
    };
  }

  static create(props: CoordinatorProps, id?: string): Coordinator {
    return new Coordinator(
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

  get courseId(): string {
    return this.props.courseId;
  }

  get isActive(): boolean {
    return this.props.isActive ?? true;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  updateCourse(courseId: string): void {
    this.props.courseId = courseId;
    this.props.updatedAt = new Date();
  }
}
