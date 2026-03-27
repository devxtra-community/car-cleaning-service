import { Pool } from 'pg';

export interface DateFilter {
  date?: string; // Single date filter
}

export interface CleanerTaskDetails {
  id: string;
  vehicleType: string | null;
  carNumber: string | null;
  carModel: string | null;
  carColor: string | null;
  buildingName: string | null;
  buildingLocation: string | null;
  floorName: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  taskAmount: number;
  finalPrice: number | null;
  status: string;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  rating?: number;
  reviewComment?: string | null;
}

export interface CleanerIncentiveDetails {
  id: string;
  amount: number;
  reason: string | null;
  createdAt: Date;
}

export interface CleanerPenaltyDetails {
  id: string;
  amount: number;
  reason: string | null;
  createdAt: Date;
}

export interface CleanerFullDetailsResponse {
  cleanerId: string;
  fullName: string;
  email: string;
  phone: string | null;
  age: number | null;
  nationality: string | null;
  documentId: string | null;
  baseSalary: number;
  profileImage: string | null;
  joiningDate: Date | null;

  buildingName: string | null;
  buildingLocation: string | null;
  floorName: string | null;
  supervisorName: string | null;

  summary: {
    totalTasks: number;
    totalTaskAmount: number;
    totalIncentives: number;
    totalPenalties: number;
    netEarning: number;
  };

  tasks: CleanerTaskDetails[];
  incentives: CleanerIncentiveDetails[];
  penalties: CleanerPenaltyDetails[];
  assignedVehicles: unknown[];
  assignmentHistory: unknown[];
}

export const getCleanerFullDetailsService = async (
  db: Pool,
  cleanerId: string,
  filter: DateFilter
): Promise<CleanerFullDetailsResponse> => {
  const { date } = filter;

  // Filter for specific date (from start of day to end of day)
  const dateCondition = date ? `AND DATE(t.created_at) = $2` : '';

  const values = date ? [cleanerId, date] : [cleanerId];

  // 1️⃣ Cleaner Basic Details
  const cleanerQuery = `
    SELECT 
      c.id AS cleaner_id,
      u.full_name,
      u.email,
      u.phone,
      u.age,
      u.nationality,
      u.document_id,
      u.base_salary,
      u.profile_image,
      u.joining_date,
      b.building_name AS building_name,
      b.location AS building_location,
      f.floor_name,
      s.full_name AS supervisor_full_name
    FROM cleaners c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN buildings b ON c.building_id = b.id
    LEFT JOIN floors f ON c.floor_id = f.id
    LEFT JOIN supervisors s ON c.supervisor_id = s.id
    WHERE c.id = $1
  `;

  const cleanerResult = await db.query(cleanerQuery, [cleanerId]);

  if (cleanerResult.rowCount === 0) {
    throw new Error('Cleaner not found');
  }

  const cleaner = cleanerResult.rows[0];

  // 2️⃣ Tasks
  const tasksQuery = `
    SELECT 
      t.*,
      b.building_name AS building_name,
      b.location AS building_location,
      f.floor_name,
      r.rating,
      r.comment
    FROM tasks t
    LEFT JOIN buildings b ON t.building_id = b.id
    LEFT JOIN floors f ON t.floor_id = f.id
    LEFT JOIN reviews r ON r.task_id = t.id
    WHERE t.cleaner_id = $1
    ${dateCondition}
    ORDER BY t.created_at DESC
  `;

  const tasksResult = await db.query(tasksQuery, values);

  // 3️⃣ Incentives
  const incentivesQuery = `
    SELECT * FROM cleaner_incentives
    WHERE cleaner_id = $1
    ${date ? 'AND DATE(created_at) = $2' : ''}
  `;

  const incentivesResult = await db.query(incentivesQuery, values);

  // 4️⃣ Penalties
  const penaltiesQuery = `
    SELECT * FROM penalties
    WHERE cleaner_id = $1
    ${date ? 'AND DATE(created_at) = $2' : ''}
  `;

  const penaltiesResult = await db.query(penaltiesQuery, values);

  // 5️⃣ Assigned Vehicles
  const assignedVehicles = await getAssignedVehiclesService(db, cleanerId);

  // 6️⃣ Assignment History
  const assignmentHistory = await getAssignmentHistoryService(db, cleanerId);

  const totalTaskAmount = tasksResult.rows.reduce(
    (sum: number, t: { task_amount: number }) => sum + Number(t.task_amount),
    0
  );

  const totalIncentives = incentivesResult.rows.reduce(
    (sum: number, i: { amount: number }) => sum + Number(i.amount),
    0
  );

  const totalPenalties = penaltiesResult.rows.reduce(
    (sum: number, p: { amount: number }) => sum + Number(p.amount),
    0
  );

  return {
    cleanerId: cleaner.cleaner_id,
    fullName: cleaner.full_name,
    email: cleaner.email,
    phone: cleaner.phone,
    age: cleaner.age,
    nationality: cleaner.nationality,
    documentId: cleaner.document_id,
    baseSalary: Number(cleaner.base_salary),
    profileImage: cleaner.profile_image,
    joiningDate: cleaner.joining_date,

    buildingName: cleaner.building_name,
    buildingLocation: cleaner.building_location,
    floorName: cleaner.floor_name,
    supervisorName: cleaner.supervisor_full_name,

    summary: {
      totalTasks: tasksResult.rowCount ?? 0,
      totalTaskAmount,
      totalIncentives,
      totalPenalties,
      netEarning: totalTaskAmount + totalIncentives - totalPenalties,
    },

    tasks: tasksResult.rows,
    incentives: incentivesResult.rows,
    penalties: penaltiesResult.rows,
    assignedVehicles,
    assignmentHistory,
  };
};

export const getAssignmentHistoryService = async (db: Pool, cleanerId: string) => {
  const query = `
    SELECT 
      ah.*,
      u.full_name as changed_by_name,
      s_p.full_name as prev_supervisor_name,
      s_n.full_name as current_supervisor_name,
      f_p.floor_name as prev_floor_name,
      f_n.floor_name as current_floor_name
    FROM assignment_history ah
    LEFT JOIN users u ON ah.changed_by = u.id
    LEFT JOIN supervisors s_p ON ah.previous_value = s_p.id AND ah.assignment_type = 'supervisor'
    LEFT JOIN supervisors s_n ON ah.new_value = s_n.id AND ah.assignment_type = 'supervisor'
    LEFT JOIN floors f_p ON ah.previous_value = f_p.id AND ah.assignment_type = 'floor'
    LEFT JOIN floors f_n ON ah.new_value = f_n.id AND ah.assignment_type = 'floor'
    WHERE ah.cleaner_id = $1
    ORDER BY ah.created_at DESC
  `;
  const { rows } = await db.query(query, [cleanerId]);
  return rows;
};

// --- Permanent Vehicle Assignment ---

export const assignVehicleService = async (
  db: Pool,
  cleanerId: string,
  vehicleData: {
    car_number: string;
    car_model: string;
    car_type: string;
    car_color?: string;
    owner_name?: string;
    owner_phone?: string;
  }
) => {
  const query = `
    INSERT INTO cleaner_assigned_vehicles (
      cleaner_id, car_number, car_model, car_type, car_color, owner_name, owner_phone
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (cleaner_id, car_number) DO UPDATE SET
      car_model = EXCLUDED.car_model,
      car_type = EXCLUDED.car_type,
      car_color = EXCLUDED.car_color,
      owner_name = EXCLUDED.owner_name,
      owner_phone = EXCLUDED.owner_phone,
      is_active = TRUE,
      updated_at = NOW()
    RETURNING *
  `;
  const values = [
    cleanerId,
    vehicleData.car_number,
    vehicleData.car_model,
    vehicleData.car_type,
    vehicleData.car_color || null,
    vehicleData.owner_name || null,
    vehicleData.owner_phone || null,
  ];
  const { rows } = await db.query(query, values);
  return rows[0];
};

export const unassignVehicleService = async (db: Pool, assignmentId: string) => {
  const query = `UPDATE cleaner_assigned_vehicles SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *`;
  const { rows } = await db.query(query, [assignmentId]);
  return rows[0];
};

export const getAssignedVehiclesService = async (db: Pool, cleanerId: string) => {
  const query = `SELECT * FROM cleaner_assigned_vehicles WHERE cleaner_id = $1 AND is_active = TRUE ORDER BY created_at DESC`;
  const { rows } = await db.query(query, [cleanerId]);
  return rows;
};
