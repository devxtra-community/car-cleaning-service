// src/types/incentive.types.ts
export interface IncentiveTarget {
  id: string;
  target_tasks: number;
  reason: string;
  incentive_amount: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DailyWorkRecord {
  id: string;
  cleaner_id: string;
  date: string;
  tasks_completed: number;
  target_tasks: number;
  base_incentive: number;
  bonus_incentive: number;
  total_incentive: number;
  notes?: string;
  created_at: Date;
}

export interface MonthlyIncentiveSummary {
  cleaner_id: string;
  month: string;
  total_days_worked: number;
  total_tasks_completed: number;
  total_incentive_earned: number;
  average_tasks_per_day: number;
}
