

export type UserRole = 'admin' | 'finops' | 'finance' | 'lead' | 'dev';

export interface UserInfo {
  username: string;
  email: string;
  role: UserRole;
  department: string;
  groups: string[];
}
