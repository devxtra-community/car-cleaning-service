import { api, setAccessToken } from './commonAPI';

interface LoginPayload {
  email: string;
  password: string;
}
export interface IncentiveTarget {
  id: string;
  target_tasks: number;
  reason: string;
  incentive_amount: number;
  active: boolean;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

export interface MonthlyIncentiveSummary {
  cleaner_id: string;
  full_name?: string;
  month: string;
  total_days_worked: number;
  total_tasks_completed: number;
  total_incentive_earned: number;
  average_tasks_per_day: number;
}

export const registerUser = async (formData: FormData) => {
  const response = await api.post('/api/auth/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const login = async ({ email, password }: LoginPayload) => {
  const response = await api.post('/api/auth/login', {
    email,
    password,
    client_type: 'web',
  });

  setAccessToken(response.data.accessToken);

  return response;
};

export const getAllSupervisors = async () => {
  const response = await api.get('/api/auth/supervisors');
  return response.data.data;
};

export const getCleanersBySupervisor = async (supervisorId: string) => {
  const response = await api.get(`/api/auth/supervisor/${supervisorId}`);
  return response.data.data;
};
export const createBuilding = (data: {
  building_name: string;
  location: string;
  latitude: number;
  longitude: number;
  radius: number;
  floors: {
    floor_number: number;
    floor_name: string;
    notes?: string;
  }[];
}) => {
  return api.post('/api/buildings', data);
};

// Incentive Targets
export const createIncentiveTarget = async (data: {
  target_tasks: number;
  reason: string;
  incentive_amount: number;
}) => {
  const response = await api.post('/api/incentives/targets', data);
  return response.data.data;
};

export const getActiveIncentiveTarget = async () => {
  const response = await api.get('/api/incentives/targets/active');
  return response.data.data;
};

export const getAllIncentiveTargets = async () => {
  const response = await api.get('/api/incentives/targets');
  return response.data.data;
};

export const updateIncentiveTarget = async (
  id: string,
  data: Partial<{
    target_tasks: number;
    reason: string;
    incentive_amount: number;
  }>
) => {
  const response = await api.put(`/api/incentives/targets/${id}`, data);
  return response.data.data;
};

export const deleteIncentiveTarget = async (id: string) => {
  const response = await api.delete(`/api/incentives/targets/${id}`);
  return response.data;
};

// Daily Work Records
export const recordDailyWork = async (data: {
  cleaner_id: string;
  date: string;
  tasks_completed: number;
  notes?: string;
}) => {
  const response = await api.post('/api/incentives/daily-work', data);
  return response.data.data;
};

export const getDailyWorkRecords = async (
  cleanerId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    month?: string;
  }
) => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.month) params.append('month', filters.month);

  const queryString = params.toString();
  const url = queryString
    ? `/api/incentives/daily-work/${cleanerId}?${queryString}`
    : `/api/incentives/daily-work/${cleanerId}`;

  const response = await api.get(url);
  return response.data.data;
};

export const deleteDailyWorkRecord = async (id: string, cleanerId: string) => {
  const response = await api.delete(`/api/incentives/daily-work/${id}?cleanerId=${cleanerId}`);
  return response.data;
};

// Monthly Summaries
export const getMonthlyIncentiveSummary = async (cleanerId: string, month: string) => {
  const response = await api.get(`/api/incentives/monthly-summary/${cleanerId}?month=${month}`);
  return response.data.data;
};

export const getAllCleanersMonthlyIncentives = async (month: string) => {
  const response = await api.get(`/api/incentives/monthly-summary?month=${month}`);
  return response.data.data;
};

// Get all workers/cleaners (if you don't have this already)
export const getAllWorkers = async () => {
  const response = await api.get('/api/auth/workers'); // or whatever your endpoint is
  return response.data.data;
};

export const getUsersByRole = async (role: string) => {
  const response = await api.get('/salary/users-by-role', {
    params: { role },
  });
  return response.data.data;
};

export const getUserSalaryDetails = async (userId: string, month: string) => {
  const response = await api.get(`/salary/user/${userId}/details`, {
    params: { month },
  });
  return response.data.data;
};

export const createSalary = async (salaryData: {
  user_id: string;
  salary_month: string;
  base_salary: number;
  penalty_amount?: number;
  monthly_review?: string;
  payment_method?: string;
  bank_account?: string;
}) => {
  const response = await api.post('/salary', salaryData);
  return response.data.data;
};

export const getAllSalaries = async () => {
  const response = await api.get('/salary');
  return response.data.data;
};

export const getSalaryDetailsPerWorker = async (userId: string) => {
  const response = await api.get(`/salary/user/${userId}`);
  console.log(response);

  return response.data.data;
};

export const updateSalary = async (
  salaryId: string,
  data: {
    base_salary?: number;
    penalty_amount?: number;
    monthly_review?: string;
    payment_method?: string;
    bank_account?: string;
  }
) => {
  const response = await api.put(`/salary/${salaryId}`, data);
  return response.data.data;
};

export const finalizeSalary = async (salaryId: string) => {
  const response = await api.patch(`/salary/${salaryId}/finalize`);
  return response.data.data;
};
