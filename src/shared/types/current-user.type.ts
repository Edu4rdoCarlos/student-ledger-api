import { UserRole } from '../enums';

export interface ICurrentUser {
  id: string;
  email: string;
  role: UserRole;
}
