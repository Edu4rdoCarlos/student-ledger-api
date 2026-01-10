import { UserBase, UserBaseProps } from '../../../user/domain/entities/user-base.entity';
import { Course } from '../../../courses/domain/entities';

export interface CoordinatorProps extends UserBaseProps {
  courseId: string;
  isActive?: boolean;
  course?: Course;
}

export class Coordinator extends UserBase {
  private constructor(props: CoordinatorProps) {
    const { isActive, ...baseProps } = props;
    super(baseProps);
    (this.props as any).isActive = isActive ?? true;
  }

  static create(props: CoordinatorProps): Coordinator {
    return new Coordinator({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  get userId(): string {
    return this.id;
  }

  get courseId(): string {
    return (this.props as CoordinatorProps).courseId;
  }

  get isActive(): boolean {
    return (this.props as CoordinatorProps).isActive ?? true;
  }

  get course(): Course | undefined {
    return (this.props as CoordinatorProps).course;
  }

  deactivate(): void {
    (this.props as any).isActive = false;
    (this.props as any).updatedAt = new Date();
  }

  activate(): void {
    (this.props as any).isActive = true;
    (this.props as any).updatedAt = new Date();
  }

  updateCourse(courseId: string): void {
    (this.props as any).courseId = courseId;
    (this.props as any).updatedAt = new Date();
  }
}
