

export type UserRole =
  | "super_admin"
  | "admin"
  | "accountant"
  | "supervisor"
  | "cleaner";

export type AppType = "web" | "mobile";

export type StaffType = "cleaner" | "supervisor";

export type ShiftType = "morning" | "evening" | "night";

export interface User {
  id: string; // UUID from DB

  // AUTH
  email: string;
  password: string;

  // ROLE & APP
  role: UserRole;
  app_type: AppType;

  is_active: boolean;
  last_login: Date | null;

  // COMMON PROFILE
  full_name: string;
  phone?: string | null;
  address?: string | null;

  // STAFF INFO
  employee_code?: string | null;
  staff_type?: StaffType | null;

  joining_date?: Date | null;
  salary?: number | null;
  shift?: ShiftType | null;

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
