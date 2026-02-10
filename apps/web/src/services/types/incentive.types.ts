// types/incentive.types.ts
export interface IncentiveTarget {
  id: string;
  target_tasks: number;
  reason: string;
  incentive_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface DailyWorkRecord {
  id: string;
  cleaner_id: string;
  date: string;
  tasks_completed: number;
  incentive_earned: number;
  notes?: string;
}

export interface CleanerIncentiveHistory {
  id: string;
  cleaner_id: string;
  date: string;
  target_tasks: number;
  tasks_completed: number;
  base_incentive: number;
  bonus_incentive: number;
  total_incentive: number;
  reason: string;
}
