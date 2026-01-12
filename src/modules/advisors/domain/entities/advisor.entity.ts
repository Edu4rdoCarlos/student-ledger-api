import { UserBase, UserBaseProps } from '../../../user/domain/entities/user-base.entity';
import { Course } from '../../../courses/domain/entities';
import { Defense } from '../../../defenses/domain/entities';

export interface AdvisorProps extends UserBaseProps {
  specialization: string;
  courseId?: string;
  course?: Course;
  isActive: boolean;
  activeAdvisorshipsCount?: number;
  defenses?: Defense[];
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

  get specialization(): string {
    return (this.props as AdvisorProps).specialization;
  }

  get courseId(): string | undefined {
    return (this.props as AdvisorProps).courseId;
  }

  get course(): Course | undefined {
    return (this.props as AdvisorProps).course;
  }

  get isActive(): boolean {
    return (this.props as AdvisorProps).isActive;
  }

  get activeAdvisorshipsCount(): number {
    return (this.props as AdvisorProps).activeAdvisorshipsCount ?? 0;
  }

  get defenses(): Defense[] | undefined {
    return (this.props as AdvisorProps).defenses;
  }

  update(data: Partial<Pick<AdvisorProps, 'specialization' | 'courseId' | 'isActive'>>): void {
    if (data.specialization !== undefined) (this.props as any).specialization = data.specialization;
    if (data.courseId !== undefined) (this.props as any).courseId = data.courseId;
    if (data.isActive !== undefined) (this.props as any).isActive = data.isActive;
    (this.props as any).updatedAt = new Date();
  }
}
