import { api, setAccessToken } from './commonAPI';
import SERVER_URL from './serverURL';

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

////////////-─────────────────────────────────────────────SUPERVISOR API─────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Add these exports to your existing src/services/allAPI.ts
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types (also add to your shared types file if you have one) ───────────────

export interface SupervisorListItem {
  supervisor_id: string;
  full_name: string;
  is_active: boolean;
  building_id: string | null;
  building_name: string | null;
  email: string | null;
  phone: string | null;
  profile_image: string | null;
  joining_date: string | null;
  base_salary: number | null;
  cleaner_count: number;
  updated_at: string;
}

export interface SupervisorCleaner {
  id: string;
  full_name: string;
  email: string;
  total_tasks: number;
  total_earning: number;
  base_salary: number;
  floor: { id: string; floor_number: number } | null;
}

export interface Supervisor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  base_salary: number;
  nationality: string;
  document_id: string;
  profile_image: string | null;
  age: number | null;
  document: string | null;
  joining_date: string | null;
  is_active: boolean;
  building: { id: string; name: string } | null;
  cleaners: SupervisorCleaner[];
}

export interface UpdateSupervisorPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  age?: number;
  nationality?: string;
  document_id?: string;
  document?: string;
  base_salary?: number;
  profile_image?: string;
  building_id?: string;
  password?: string;
}

export interface AvailableCleaner {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  building_id: string | null;
  building_name: string | null;
  floor_id: string | null;
  floor_name: string | null;
  floor_number: number | null;
  incentive_target: number;
}

export interface BuildingOption {
  id: string;
  building_name: string;
  location: string | null;
}

// ─── API calls ─────────────────────────────────────────────────────────────────

export const getAllSupervisors = async (): Promise<SupervisorListItem[]> => {
  const response = await api.get('/supervisors');
  return response.data.data;
};

export const getUnassignedSupervisors = async (): Promise<SupervisorListItem[]> => {
  const response = await api.get('/supervisors/unassigned');
  return response.data.data;
};

export const getSupervisorDetails = async (
  id: string
): Promise<{ success: boolean; data: Supervisor }> => {
  const response = await api.get(`/supervisors/${id}`);
  return response.data;
};

export const updateSupervisor = async (
  id: string,
  payload: UpdateSupervisorPayload
): Promise<{ success: boolean; message: string; data: Supervisor }> => {
  const response = await api.put(`/supervisors/${id}`, payload);
  return response.data;
};

export const toggleSupervisorStatus = async (
  id: string,
  is_active: boolean
): Promise<{ success: boolean; message: string }> => {
  const response = await api.patch(`/supervisors/${id}/toggle-status`, { is_active });
  return response.data;
};

export const deleteSupervisor = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/supervisors/${id}`);
  return response.data;
};

export const getAvailableCleaners = async (supervisorId: string): Promise<AvailableCleaner[]> => {
  const response = await api.get(`/supervisors/${supervisorId}/available-cleaners`);
  return response.data.data;
};

export const assignCleanerToSupervisor = async (
  supervisorId: string,
  cleanerId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/supervisors/${supervisorId}/assign-cleaner`, {
    cleanerId,
  });
  return response.data;
};

export const removeCleanerFromSupervisor = async (
  supervisorId: string,
  cleanerId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/supervisors/${supervisorId}/cleaners/${cleanerId}`);
  return response.data;
};

export const getSupervisorBuildingOptions = async (): Promise<BuildingOption[]> => {
  const response = await api.get('/supervisors/buildings');
  return response.data.data;
};

export interface CleanerListItem {
  cleaner_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  nationality: string | null;
  document_id: string | null;
  document: string | null;
  profile_image: string | null;
  base_salary: number | null;
  joining_date: string | null;
  building_id: string | null;
  building_name: string | null;
  floor_id: string | null;
  floor_name: string | null;
  floor_number: number | null;
  supervisor_id: string | null;
  supervisor_profile_id: string | null;
  supervisor_name: string | null;
  total_tasks: number;
  total_earning: number;
  is_active: boolean;
  created_at: string;
}

export interface CleanerTask {
  id: string;
  vehicle_type: string | null;
  car_number: string | null;
  car_model: string | null;
  car_type: string | null;
  car_color: string | null;
  car_image_url: string | null;
  building_name: string | null;
  building_location: string | null;
  floor_name: string | null;
  started_at: string | null;
  completed_at: string | null;
  task_amount: string;
  final_price: string | null;
  status: string;
  before_photo_url: string | null;
  after_photo_url: string | null;
  after_wash_image_url: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  payment_method: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

export interface CleanerIncentive {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}
export interface CleanerPenalty {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

export interface CleanerDetail {
  cleanerId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  age: number | null;
  nationality: string | null;
  document: string | null;
  documentId: string | null;
  profileImage: string | null;
  baseSalary: number;
  joiningDate: string | null;
  isActive: boolean;
  totalTasks: number;
  totalEarning: number;
  building: { id: string; name: string; location: string } | null;
  floor: { id: string; name: string; number: number } | null;
  supervisor: { id: string; name: string } | null;
  summary: {
    totalTasks: number;
    totalTaskAmount: number;
    totalIncentives: number;
    totalPenalties: number;
    netEarning: number;
  };
  tasks: CleanerTask[];
  incentives: CleanerIncentive[];
  penalties: CleanerPenalty[];
}

export interface UpdateCleanerPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  age?: number;
  nationality?: string;
  document_id?: string;
  document?: string;
  base_salary?: number;
  profile_image?: string;
  password?: string;
  building_id?: string;
  floor_id?: string;
  supervisor_id?: string | null;
}

export interface FloorOption {
  id: string;
  floor_name: string;
  floor_number: number;
}
export interface SupervisorOption {
  id: string;
  full_name: string;
  is_active: boolean;
}
export interface BuildingDropdownItem {
  id: string;
  building_name: string;
  location: string | null;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const getAllCleaners = async (): Promise<CleanerListItem[]> =>
  (await api.get('/workers')).data.data;

export const getCleanerDetail = async (
  id: string,
  date?: string
): Promise<{ success: boolean; data: CleanerDetail }> =>
  (await api.get(`/workers/${id}`, { params: date ? { date } : {} })).data;

export const updateCleaner = async (
  id: string,
  payload: UpdateCleanerPayload
): Promise<{ success: boolean; message: string; data: CleanerDetail }> =>
  (await api.put(`/workers/${id}`, payload)).data;

export const toggleCleanerStatus = async (
  id: string,
  is_active: boolean
): Promise<{ success: boolean; message: string }> =>
  (await api.patch(`/workers/${id}/toggle-status`, { is_active })).data;

export const deleteCleaner = async (id: string): Promise<{ success: boolean; message: string }> =>
  (await api.delete(`/workers/${id}`)).data;

export const getCleanerBuildings = async (): Promise<BuildingDropdownItem[]> =>
  (await api.get('/workers/buildings')).data.data;

export const getFloorsForBuilding = async (buildingId: string): Promise<FloorOption[]> =>
  (await api.get(`/workers/buildings/${buildingId}/floors`)).data.data;

export const getSupervisorsForBuilding = async (buildingId: string): Promise<SupervisorOption[]> =>
  (await api.get(`/workers/buildings/${buildingId}/supervisors`)).data.data;

// ─── Auth — add to loginUserService after bcrypt.compare ─────────────────────
// export const checkCleanerNotBlocked = async (userId: string, role: string) => {
//   if (role !== 'cleaner') return;
//   const r = await pool.query('SELECT is_active FROM cleaners WHERE user_id = $1', [userId]);
//   if (!r.rows.length || !(r.rows[0] as { is_active: boolean }).is_active)
//     throw new AppError('Your account has been temporarily blocked. Please contact the administrator.', 403, 'ACCOUNT_BLOCKED');
// };

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

export interface SalaryPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'locked' | 'paid';
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  locked_at: string | null;
  locked_by_name: string | null;
  paid_at: string | null;
  created_at: string;
  total_cleaners: number;
  locked_count: number;
  paid_count: number;
  total_payout: number;
}

export interface SalaryRecord {
  id: string;
  salary_period_id: string;
  cleaner_id: string;
  full_name: string;
  email: string;
  profile_image: string | null;
  building_name: string | null;
  floor_name: string | null;
  floor_number: number | null;
  supervisor_name: string | null;
  base_salary: number;
  total_tasks: number;
  total_task_amount: number;
  total_incentives: number;
  total_penalties: number;
  total_adjustments: number;
  net_salary: number;
  status: 'draft' | 'finalized' | 'locked' | 'paid';
  notes: string | null;
  finalized_at: string | null;
  finalized_by_name: string | null;
  adjustments: SalaryAdjustment[];
}

export interface SalaryAdjustment {
  id: string;
  type: 'bonus' | 'deduction';
  amount: number;
  reason: string;
  created_by_name: string | null;
  created_at: string;
}

export interface SalaryRecordDetail {
  record: SalaryRecord & {
    period_name: string;
    start_date: string;
    end_date: string;
    joining_date: string | null;
    document_id: string | null;
    building_location: string | null;
  };
  tasks: TaskRow[];
  incentives: IncentiveRow[];
  penalties: PenaltyRow[];
  adjustments: SalaryAdjustment[];
  dailyBreakdown: DailyBreakdownRow[];
}

export interface TaskRow {
  id: string;
  car_number: string | null;
  car_type: string | null;
  final_price: string;
  completed_at: string;
  building_name: string | null;
  floor_name: string | null;
}

export interface IncentiveRow {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}
export interface PenaltyRow {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

export interface DailyBreakdownRow {
  date: string;
  tasks_completed: number;
  incentive_amount: number | null;
  rule_name: string | null;
  rule_description: string | null;
  calculation_details: Record<string, unknown> | null;
}

export interface MonthlyReportRow {
  period_id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  period_status: string;
  total_cleaners: number;
  total_base: number;
  total_task_amount: number;
  total_incentives: number;
  total_penalties: number;
  total_adjustments: number;
  total_net: number;
}

export interface CleanerSalaryHistoryRow {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  period_status: string;
  base_salary: number;
  total_tasks: number;
  total_task_amount: number;
  total_incentives: number;
  total_penalties: number;
  total_adjustments: number;
  net_salary: number;
  status: string;
  finalized_at: string | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const getAllSalaryPeriods = async (): Promise<SalaryPeriod[]> =>
  (await api.get('/api/salary')).data.data;

export const getSalaryPeriod = async (
  id: string
): Promise<{ period: SalaryPeriod; records: SalaryRecord[] }> =>
  (await api.get(`/api/salary/${id}`)).data.data;

export const createSalaryPeriod = async (p: {
  name: string;
  start_date: string;
  end_date: string;
  notes?: string;
}) => (await api.post('/api/salary', p)).data;

export const updateSalaryPeriod = async (
  id: string,
  p: { name: string; start_date: string; end_date: string; notes?: string }
) => (await api.put(`/api/salary/${id}`, p)).data;

export const calculateSalaries = async (id: string) =>
  (await api.post(`/api/salary/${id}/calculate`)).data;

export const lockSalaryPeriod = async (id: string) =>
  (await api.post(`/api/salary/${id}/lock`)).data;

export const markSalaryPeriodPaid = async (id: string) =>
  (await api.post(`/api/salary/${id}/mark-paid`)).data;

export const getSalaryRecordDetail = async (
  recordId: string
): Promise<{ success: boolean; data: SalaryRecordDetail }> =>
  (await api.get(`/api/salary/records/${recordId}`)).data;

export const finalizeSalaryRecord = async (recordId: string, notes?: string) =>
  (await api.post(`/api/salary/records/${recordId}/finalize`, { notes })).data;

export const unfinalizeSalaryRecord = async (recordId: string) =>
  (await api.post(`/api/salary/records/${recordId}/unfinalize`)).data;

export const addSalaryAdjustment = async (
  recordId: string,
  p: { type: 'bonus' | 'deduction'; amount: number; reason: string }
) => (await api.post(`/api/salary/records/${recordId}/adjustments`, p)).data;

export const deleteSalaryAdjustment = async (adjustmentId: string) =>
  (await api.delete(`/api/salary/adjustments/${adjustmentId}`)).data;

export const getCleanerSalaryHistory = async (
  cleanerId: string
): Promise<CleanerSalaryHistoryRow[]> =>
  (await api.get(`/api/salary/cleaner/${cleanerId}/history`)).data.data;

export const getMonthlyReport = async (year: number, month?: number): Promise<MonthlyReportRow[]> =>
  (await api.get('/api/salary/reports/monthly', { params: { year, month } })).data.data;

export const exportSalaryCSV = (periodId: string) => {
  window.open(`${SERVER_URL}/api/salary/${periodId}/export/csv`, '_blank');
};
export const exportSalaryExcel = (periodId: string) => {
  window.open(`${SERVER_URL}/api/salary/${periodId}/export/excel`, '_blank');
};
