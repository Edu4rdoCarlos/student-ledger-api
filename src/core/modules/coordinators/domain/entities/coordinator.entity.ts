import { UserBase, UserBaseProps } from '../../../user/domain/entities/user-base.entity';
import { Course } from '../../../courses/domain/entities';

export interface CoordinatorProps extends UserBaseProps {
  courseId: string | null;
  isActive?: boolean;
  course?: Course;
}

export class Coordinator extends UserBase {
  protected declare readonly props: CoordinatorProps;

  private constructor(props: CoordinatorProps) {
    super(props);
  }

  static create(props: CoordinatorProps): Coordinator {
    return new Coordinator({
      ...props,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  get userId(): string {
    return this.id;
  }

  get courseId(): string | null {
    return this.props.courseId;
  }

  get isActive(): boolean {
    return this.props.isActive ?? true;
  }

  get course(): Course | undefined {
    return this.props.course;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.courseId = null;
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

  updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  removeCourse(): void {
    this.props.courseId = null;
    this.props.updatedAt = new Date();
  }
}
