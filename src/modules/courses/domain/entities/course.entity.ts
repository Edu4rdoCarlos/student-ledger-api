import { UserBase } from '../../../user/domain/entities';

export interface CourseProps {
  code: string;
  name: string;
  active: boolean;
  coordinatorId?: string;
  coordinator?: UserBase;
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

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get active(): boolean {
    return this.props.active;
  }

  get coordinatorId(): string | undefined {
    return this.props.coordinatorId;
  }

  get coordinator(): UserBase | undefined {
    return this.props.coordinator;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  update(data: Partial<Pick<CourseProps, 'name' | 'active' | 'coordinatorId'>>): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.active !== undefined) this.props.active = data.active;
    if (data.coordinatorId !== undefined) this.props.coordinatorId = data.coordinatorId;
    this.props.updatedAt = new Date();
  }
}
