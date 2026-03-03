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
  cleaner_id?: string;
  building_id?: string;
  floor_id?: string;
  cleaner_name?: string;
  building_name?: string;
  floor_name?: string;
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

//------------------Supervisor Report------------------//

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupervisorBuilding {
  id: string;
  name: string;
}

export interface SupervisorFloor {
  id: string;
  floor_number: number;
}

export interface SupervisorCleaner {
  id: string;
  full_name: string;
  email: string;
  total_tasks: number;
  total_earning: number;
  base_salary: number;
  incentive_target: number;
  floor: SupervisorFloor | null;
}

export interface Supervisor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  base_salary: number;
  nationality: string;
  document_id: string;
  age?: number;
  profile_image?: string;
  document?: string;
  joining_date?: string;
  is_active: boolean;
  building?: SupervisorBuilding | null;
  cleaners: SupervisorCleaner[];
}

/** Shape returned by GET /api/auth/supervisors (list view) */
export interface SupervisorListItem {
  supervisor_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  location?: string;
  profile_image?: string;
  is_active?: boolean;
  building_id?: string;
  building_name?: string;
}

export interface SupervisorWorker {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface SupervisorReportEntry {
  worker_id: string;
  full_name: string;
  total_tasks: number;
}

export interface UpdateSupervisorPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  document_id?: string;
  age?: number;
  base_salary?: number;
  building_id?: string;
  profile_image?: string;
  document?: string;
  password?: string;
}

// ─── Admin endpoints ──────────────────────────────────────────────────────────

/**
 * GET /api/supervisors/:id
 * Full details of a single supervisor including cleaners (admin).
 */
export const getSupervisorDetails = async (
  id: string
): Promise<{ success: boolean; data: Supervisor }> => {
  const response = await api.get(`/supervisors/${id}`);
  return response.data;
};

/**
 * PUT /supervisors/:id
 * Update a supervisor's profile (admin).
 */
export const updateSupervisor = async (
  id: string,
  payload: UpdateSupervisorPayload
): Promise<{ success: boolean; message?: string; data: Supervisor }> => {
  const response = await api.put(`/supervisors/${id}`, payload);
  return response.data;
};

/**
 * PATCH /supervisors/:id/status
 * Activate or deactivate a supervisor (admin).
 */
export const toggleSupervisorStatus = async (
  id: string,
  isActive: boolean
): Promise<{ success: boolean; message?: string; data: { id: string; is_active: boolean } }> => {
  const response = await api.patch(`/supervisors/${id}/status`, {
    is_active: isActive,
  });
  return response.data;
};

/**
 * DELETE /supervisors/:id
 * Permanently delete a supervisor (admin).
 * Returns 400 if the supervisor still has assigned cleaners.
 */
export const deleteSupervisor = async (
  id: string
): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete(`/supervisors/${id}`);
  return response.data;
};

// ─── Supervisor-role endpoints ────────────────────────────────────────────────

/**
 * GET /supervisors/workers
 * Workers assigned to the currently logged-in supervisor.
 */
export const getSupervisorWorkers = async (): Promise<SupervisorWorker[]> => {
  const response = await api.get('/supervisors/workers');
  return response.data.data;
};

/**
 * GET /supervisors/report?period=day|week|month
 * Performance report for the logged-in supervisor.
 */
export const getSupervisorReport = async (
  period: 'day' | 'week' | 'month' = 'month'
): Promise<SupervisorReportEntry[]> => {
  const response = await api.get('/supervisors/report', {
    params: { period },
  });
  return response.data.data;
};

export interface CleanerDateFilter {
  date?: string;
}

export const getCleanerFullDetails = async (cleanerId: string, filters?: CleanerDateFilter) => {
  const params = new URLSearchParams();

  if (filters?.date) params.append('date', filters.date);

  const response = await api.get(`/workers/cleaners/${cleanerId}`, { params });

  return response.data;
};
export interface Floor {
  floor_number: number;
  floor_name: string;
  notes?: string;
}

export interface CreateBuildingPayload {
  building_name: string;
  location: string;
  latitude: number;
  longitude: number;
  radius: number;
  floors: Floor[];
}

export interface UpdateBuildingPayload {
  building_name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

// Get all buildings with statistics
export const getAllBuildingsWithStats = async () => {
  const response = await api.get('/api/buildings/stats');
  return response.data;
};

// Get all buildings (simple)
export const getAllBuildings = async () => {
  const response = await api.get('/api/buildings');
  return response.data;
};

// Get building by ID
export const getBuildingById = async (id: string) => {
  const response = await api.get(`/api/buildings/${id}`);
  return response.data;
};

// Get building details with comprehensive statistics
export const getBuildingDetails = async (id: string) => {
  const response = await api.get(`/api/buildings/${id}/details`);
  return response.data;
};

// Create building
export const createBuilding = async (payload: CreateBuildingPayload) => {
  const response = await api.post('/api/buildings', payload);
  return response.data;
};

// Update building
export const updateBuilding = async (id: string, payload: UpdateBuildingPayload) => {
  const response = await api.put(`/api/buildings/${id}`, payload);
  return response.data;
};

// Delete building
export const deleteBuilding = async (id: string) => {
  const response = await api.delete(`/api/buildings/${id}`);
  return response.data;
};

// Incentive Targets
export const createIncentiveTarget = async (data: {
  target_tasks: number;
  reason: string;
  incentive_amount: number;
  cleaner_id?: string;
  building_id?: string;
  floor_id?: string;
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
    cleaner_id: string | null;
    building_id: string | null;
    floor_id: string | null;
    active: boolean;
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
  }
) => {
  const response = await api.put(`/salary/${salaryId}`, data);
  return response.data.data;
};

export const finalizeSalary = async (salaryId: string) => {
  const response = await api.patch(`/salary/${salaryId}/finalize`);
  return response.data.data;
};

export const getSalaryCycles = async () => {
  const response = await api.get('/salary/salary-cycles');
  return response.data.data;
};

export const lockSalaryPeriod = async (cycleId: string) => {
  const response = await api.post(`/salary/lock/${cycleId}`);
  return response.data;
};

// ─── Vehicle Assignments ──────────────────────────────────────────────────

export const assignVehicle = async (data: any) => {
  const response = await api.post('/workers/assignments/vehicle', data);
  return response.data;
};

export const unassignVehicle = async (id: string) => {
  const response = await api.delete(`/workers/assignments/vehicle/${id}`);
  return response.data;
};

export const getCleanerAssignedVehicles = async (cleanerId: string) => {
  const response = await api.get(`/workers/assignments/vehicle/${cleanerId}`);
  return response.data;
};

// ─── Analytics & Insights ────────────────────────────────────────────────

export const getBuildingComparison = async () => {
  const response = await api.get('/api/analytics/building-comparison');
  return response.data;
};

export const getCustomerRatingSummary = async () => {
  const response = await api.get('/api/analytics/rating-summary');
  return response.data;
};

export const getFraudTrends = async () => {
  const response = await api.get('/api/analytics/fraud-trends');
  return response.data;
};

export const getCollectionsReconciliation = async () => {
  const response = await api.get('/api/analytics/collections-reconciliation');
  return response.data;
};

export const getAllFloors = async () => {
  const response = await api.get('/api/floors');
  return response.data;
};

