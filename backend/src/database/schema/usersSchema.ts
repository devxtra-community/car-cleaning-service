export type ClientType = 'web' | 'mobile';

export type UserRole = 'super_admin' | 'admin' | 'accountant' | 'supervisor' | 'cleaner';

export interface User {
  id: string;
  email: string;
  password: string;

  role: UserRole;
  client_type: ClientType;

  full_name: string;
  document?: string;
  age?: number;
  nationality?: string;

  is_active: boolean;
  last_login: Date | null;

  created_at: Date;
  updated_at: Date;
}
