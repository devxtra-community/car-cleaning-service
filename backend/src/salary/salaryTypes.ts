// Interfaces matching exact column names from your NeonDB Schema
export interface User {
  id: string;
  full_name: string;
  role: string;
  base_salary: number;
  building_id?: string;
  floor_id?: string;
  email?: string;
  phone?: string;
  joining_date?: Date;
  // Note: Password deliberately excluded for security
}

export interface Cleaner {
  id: string;
  user_id: string;
  supervisor_id?: string;
  building_id?: string;
  floor_id?: string;
  total_tasks?: number;
  total_earning?: number;
  incentive_target?: number;
  created_at: Date;
  is_active: boolean;
}

export interface SalaryCycle {
  id: string;
  month: number;
  year: number;
  start_date: Date;
  end_date: Date;
  is_locked: boolean;
  locked_at?: Date;
  locked_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Salary {
  id: string;
  user_id: string;
  salary_cycle_id: string;
  base_salary: number;
  incentives: number;
  penalties: number;
  final_salary: number;
  status: string; // 'pending' | 'locked' | 'paid'
  created_at: Date;
  finalized_at?: Date;
  payout_date?: Date;
}
