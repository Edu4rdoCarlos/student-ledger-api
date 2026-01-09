import { UserBase, UserBaseProps } from '../../../user/domain/entities/user-base.entity';

export interface Department {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
}

export interface AdvisorProps extends UserBaseProps {
  departmentId?: string;
  department?: Department;
  specialization?: string;
  courseId?: string;
  course?: Course;
}

export class Advisor extends UserBase {
  private constructor(props: AdvisorProps) {
    super(props);
  }

  static create(props: AdvisorProps): Advisor {
    return new Advisor({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  get userId(): string {
    return this.id;
  }

  get departmentId(): string | undefined {
    return (this.props as AdvisorProps).departmentId;
  }

  get department(): Department | undefined {
    return (this.props as AdvisorProps).department;
  }

  get specialization(): string | undefined {
    return (this.props as AdvisorProps).specialization;
  }

  get courseId(): string | undefined {
    return (this.props as AdvisorProps).courseId;
  }

  get course(): Course | undefined {
    return (this.props as AdvisorProps).course;
  }

  update(data: Partial<Pick<AdvisorProps, 'departmentId' | 'specialization' | 'courseId'>>): void {
    if (data.departmentId !== undefined) (this.props as any).departmentId = data.departmentId;
    if (data.specialization !== undefined) (this.props as any).specialization = data.specialization;
    if (data.courseId !== undefined) (this.props as any).courseId = data.courseId;
    (this.props as any).updatedAt = new Date();
  }
}
