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
  protected declare readonly props: AdvisorProps;

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
    return this.props.specialization;
  }

  get courseId(): string | undefined {
    return this.props.courseId;
  }

  get course(): Course | undefined {
    return this.props.course;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get activeAdvisorshipsCount(): number {
    return this.props.activeAdvisorshipsCount ?? 0;
  }

  get defenses(): Defense[] | undefined {
    return this.props.defenses;
  }

  update(data: Partial<Pick<AdvisorProps, 'specialization' | 'courseId' | 'isActive'>>): void {
    if (data.specialization !== undefined) {
      this.props.specialization = data.specialization;
    }
    if (data.courseId !== undefined) {
      this.props.courseId = data.courseId;
    }
    if (data.isActive !== undefined) {
      this.props.isActive = data.isActive;
    }
    this.props.updatedAt = new Date();
  }
}
