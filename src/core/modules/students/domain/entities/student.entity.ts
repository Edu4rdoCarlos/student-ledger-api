import { UserBase, UserBaseProps } from '../../../user/domain/entities/user-base.entity';

export interface StudentProps extends UserBaseProps {
  matricula: string;
  courseId: string;
}

export class Student extends UserBase {
  private readonly studentProps: StudentProps;

  private constructor(props: StudentProps) {
    super(props);
    this.studentProps = props;
  }

  static create(props: StudentProps): Student {
    return new Student({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  get matricula(): string {
    return this.studentProps.matricula;
  }

  get userId(): string {
    return this.id;
  }

  get courseId(): string {
    return this.studentProps.courseId;
  }

  updateCourse(courseId: string): void {
    this.studentProps.courseId = courseId;
    this.studentProps.updatedAt = new Date();
  }
}
