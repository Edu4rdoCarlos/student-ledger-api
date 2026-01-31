export interface CourseBasic {
  code: string;
  name: string;
  active: boolean;
}

export interface UserBaseProps {
  id: string;
  email: string;
  name: string;
  role: string;
  isFirstAccess?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  course?: CourseBasic | null;
}

export class UserBase {
  constructor(protected readonly props: UserBaseProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): string {
    return this.props.role;
  }

  get isFirstAccess(): boolean | undefined {
    return this.props.isFirstAccess;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get course(): CourseBasic | null | undefined {
    return this.props.course;
  }
}
