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
  user_id: string;
  full_name: string;
  email: string;
  total_tasks: number;
  total_earning: number;
  base_salary: number;
  incentive_target: number;
  is_active: boolean;
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

export const getCleanerDetail = async (id: string) => {
  const response = await api.get(`/workers/cleaners/${id}`);
  return response.data;
};

export const updateCleaner = async (id: string, payload: any) => {
  const response = await api.patch(`/workers/cleaners/${id}`, payload);
  return response.data;
};

export const deleteCleaner = async (id: string) => {
  const response = await api.delete(`/workers/cleaners/${id}`);
  return response.data;
};

export const toggleUserStatus = async (id: string, isActive: boolean) => {
  const response = await api.patch(`/api/auth/users/${id}/status`, { is_active: isActive });
  return response.data;
};

export const resetUserPassword = async (id: string, newPassword: string) => {
  const response = await api.patch(`/api/auth/users/${id}/reset-password`, {
    new_password: newPassword,
  });
  return response.data;
};

export const getCleanerBuildings = async () => {
  const response = await api.get('/api/buildings');
  return response.data.data;
};

export const getFloorsForBuilding = async (buildingId: string) => {
  const response = await api.get(`/api/auth/buildings/${buildingId}/floors`);
  return response.data.data;
};

export const getSupervisorsForBuilding = async (buildingId: string) => {
  const response = await api.get(`/api/auth/buildings/${buildingId}/supervisors`);
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

export const getAllSalaries = async (limit?: number, offset?: number) => {
  const response = await api.get('/salary', {
    params: { limit, offset },
  });
  return response.data;
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

export const getSalaryPeriod = async (periodId: string) => {
  const response = await api.get(`/salary/period/${periodId}`);
  return response.data;
};

export const calculateSalaries = async (periodId: string) => {
  const response = await api.post(`/salary/calculate/${periodId}`);
  return response.data;
};

export const markSalaryPeriodPaid = async (periodId: string) => {
  const response = await api.patch(`/salary/period/${periodId}/pay`);
  return response.data;
};

export const finalizeSalaryRecord = async (id: string, notes?: string) => {
  const response = await api.patch(`/salary/record/${id}/finalize`, { notes });
  return response.data;
};

export const unfinalizeSalaryRecord = async (id: string) => {
  const response = await api.patch(`/salary/record/${id}/unfinalize`);
  return response.data;
};

export const exportSalaryCSV = async (id: string) => {
  const response = await api.get(`/salary/export/csv/${id}`);
  return response.data;
};

export const exportSalaryExcel = async (id: string) => {
  const response = await api.get(`/salary/export/excel/${id}`);
  return response.data;
};

export const getMonthlyReport = async (params: any) => {
  const response = await api.get('/salary/reports/monthly', { params });
  return response.data;
};

export const getCleanerSalaryHistory = async (id: string) => {
  const response = await api.get(`/salary/history/cleaner/${id}`);
  return response.data;
};

export interface UpdateCleanerPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  age?: number;
  password?: string;
  nationality?: string;
  document_id?: string;
  base_salary?: number;
  profile_image?: string;
  building_id?: string;
  floor_id?: string;
  supervisor_id?: string;
}

export interface CleanerDetail {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  age?: number;
  nationality?: string;
  documentId?: string;
  baseSalary?: number;
  profileImage?: string;
  building?: { id: string; name: string; building_name?: string; location?: string };
  floor?: { id: string; name: string; number?: string | number; floor_number?: number; floor_name?: string };
  supervisor?: { id: string; name: string; full_name?: string };
}

export interface FloorOption {
  id: string;
  name: string;
  floor_number?: number;
  floor_name?: string;
}

export interface SupervisorOption {
  id: string;
  name: string;
  full_name?: string;
}

export interface BuildingDropdownItem {
  id: string;
  name: string;
  building_name?: string;
  location?: string;
}

export interface MonthlyReportRow {
  period_id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  total_cleaners: number;
  total_base: string | number;
  total_task_amount: string | number;
  total_incentives: string | number;
  total_penalties: string | number;
  total_adjustments: string | number;
  total_net: string | number;
  period_status: string;
}

export interface CleanerSalaryHistoryRow {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  base_salary: string | number;
  total_tasks: number;
  total_task_amount: string | number;
  total_incentives: string | number;
  total_penalties: string | number;
  total_adjustments: string | number;
  net_salary: string | number;
  status: string;
}


export interface SalaryPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  total_net: number;
}

export interface SalaryRecord {
  id: string;
  worker_id: string;
  full_name: string;
  profile_image?: string;
  building_id?: string;
  building_name?: string;
  floor_id?: string;
  floor_number?: number;
  base_salary: number;
  total_tasks: number;
  total_task_amount: number;
  total_incentives: number;
  total_penalties: number;
  total_adjustments: number;
  net_salary: number;
  status: string;
  finalized_by_name?: string;
  salary_period_id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  supervisor_name?: string;
  finalized_at?: string;
  notes?: string;
}

export interface SalaryAdjustment {
  id: string;
  salary_record_id: string;
  type: 'bonus' | 'deduction';
  amount: number;
  reason: string;
  created_by_name?: string;
  created_at: string;
}

export interface SalaryRecordDetail {
  record: SalaryRecord;
  tasks: any[];
  incentives: any[];
  penalties: any[];
  dailyBreakdown: any[];
  adjustments: SalaryAdjustment[];
}

// ─── Salary API Extensions ────────────────────────────────────────────────

export const getSalaryRecordDetail = async (id: string) => {
  const response = await api.get(`/salary/records/${id}`);
  return response.data;
};

export const addSalaryAdjustment = async (recordId: string, data: any) => {
  const response = await api.post(`/salary/records/${recordId}/adjustments`, data);
  return response.data;
};

export const deleteSalaryAdjustment = async (id: string) => {
  const response = await api.delete(`/salary/adjustments/${id}`);
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

export const getAdminSummary = async () => {
  const response = await api.get('/api/analytics/summary');
  return response.data;
};


export interface AdminListItem {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  nationality: string | null;
  document_id: string | null;
  base_salary: number | null;
  profile_image: string | null;
  building_id: string | null;
  floor_id: string | null;
  joining_date: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  token_version: number;
  // derived
  is_active: boolean;
}

export interface AccountantListItem {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  nationality: string | null;
  document_id: string | null;
  base_salary: number | null;
  profile_image: string | null;
  building_id: string | null;
  floor_id: string | null;
  joining_date: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  token_version: number;
  building_name: string | null;
  floor_name: string | null;
  floor_number: number | null;
  // derived
  is_active: boolean;
}

export interface UserUpdatePayload {
  full_name?: string;
  email?: string;
  phone?: string;
  age?: number;
  nationality?: string;
  document_id?: string;
  base_salary?: number;
  profile_image?: string;
  joining_date?: string;
  building_id?: string | null;
  floor_id?: string | null;
  password?: string;
}

// helper: derive is_active from token_version
const withActive = <T extends { token_version: number }>(row: T): T & { is_active: boolean } => ({
  ...row,
  is_active: row.token_version >= 0,
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API
// ─────────────────────────────────────────────────────────────────────────────

export const getAllAdmins = async (): Promise<AdminListItem[]> => {
  const { data } = await api.get('/api/admins');
  return (data as AdminListItem[]).map(withActive);
};

export const getAdminById = async (id: string): Promise<AdminListItem> => {
  const { data } = await api.get(`/api/admins/${id}`);
  return withActive(data as AdminListItem);
};

export const updateAdmin = async (
  id: string,
  payload: UserUpdatePayload
): Promise<AdminListItem> => {
  const { data } = await api.put(`/api/admins/${id}`, payload);
  return withActive(data as AdminListItem);
};

export const deleteAdmin = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/admins/${id}`);
  return data;
};

export const toggleAdminStatus = async (
  id: string,
  isActive: boolean
): Promise<{ id: string; is_active: boolean }> => {
  const { data } = await api.patch(`/api/admins/${id}/toggle-status`, { is_active: isActive });
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTANT API
// ─────────────────────────────────────────────────────────────────────────────

export const getAllAccountants = async (): Promise<AccountantListItem[]> => {
  const { data } = await api.get('/api/accountants');
  return (data as AccountantListItem[]).map(withActive);
};

export const getAccountantById = async (id: string): Promise<AccountantListItem> => {
  const { data } = await api.get(`/api/accountants/${id}`);
  return withActive(data as AccountantListItem);
};

export const updateAccountant = async (
  id: string,
  payload: UserUpdatePayload
): Promise<AccountantListItem> => {
  const { data } = await api.put(`/api/accountants/${id}`, payload);
  return withActive(data as AccountantListItem);
};

export const deleteAccountant = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/accountants/${id}`);
  return data;
};

export const toggleAccountantStatus = async (
  id: string,
  isActive: boolean
): Promise<{ id: string; is_active: boolean }> => {
  const { data } = await api.patch(`/api/accountants/${id}/toggle-status`, { is_active: isActive });
  return data;
};
