import { UserBase, UserBaseProps } from '../../../user/domain/entities/user-base.entity';

export interface StudentProps extends UserBaseProps {
  matricula: string;
  courseId: string;
}

export class Student extends UserBase {
  private constructor(props: StudentProps) {
    super(props);
  }

  static create(props: StudentProps): Student {
    return new Student({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  get matricula(): string {
    return (this.props as StudentProps).matricula;
  }

  get userId(): string {
    return this.id;
  }

  get courseId(): string {
    return (this.props as StudentProps).courseId;
  }

  updateCourse(courseId: string): void {
    const props = this.props as StudentProps;
    (props as any).courseId = courseId;
    (props as any).updatedAt = new Date();
  }
}
