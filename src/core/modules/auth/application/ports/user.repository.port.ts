export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  isFirstAccess?: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: string;
  organizationId?: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  existsByEmail(email: string): Promise<boolean>;
  changePassword(userId: string, newPassword: string, isFirstAccess?: boolean): Promise<void>;
  create(data: CreateUserData): Promise<User>;
  updateName(userId: string, name: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
