export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  isFirstAccess?: boolean;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
