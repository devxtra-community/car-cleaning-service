export type UserRole =
  | "super_admin"
  | "admin"
  | "accountant"
  | "supervisor"
  | "cleaner";

export type ClientType = "web" | "mobile";

export interface User {
  id: string;

  // AUTH
  email: string;
  password: string;

  // ROLE & ACCESS
  role: UserRole;
  allowed_clients: ClientType[];

  is_active: boolean;
  last_login: Date | null;

  // PROFILE
  full_name: string;
  phone?: string | null;
  address?: string | null;

  // STAFF INFO
  employee_code?: string | null;
  staff_type?: "cleaner" | "supervisor" | null;
  joining_date?: Date | null;
  salary?: number | null;

  assigned_area?: string | null;
  supervisor_id?: string | null;

  is_available?: boolean;
  device_id?: string | null;

  // ADMIN INFO
  designation?: string | null;
  department?: string | null;
  institution?: string | null;
  office_location?: string | null;

  // AUDIT
  created_at: Date;
  updated_at: Date;
}