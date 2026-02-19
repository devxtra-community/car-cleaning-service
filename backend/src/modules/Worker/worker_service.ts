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
  };
};
