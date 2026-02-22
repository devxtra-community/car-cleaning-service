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

import { pool } from '../../database/connectDatabase';
import bcrypt from 'bcrypt';
import { AppError } from 'src/middlewares/error-handler';

export interface UpdateCleanerData {
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
  is_active?: boolean;
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────

export const getAllCleanersService = async () => {
  const { rows } = await pool.query(`
    SELECT
      c.id              AS cleaner_id,
      c.user_id,
      c.building_id,
      c.floor_id,
      c.supervisor_id,
      c.total_tasks,
      c.total_earning,
      c.is_active,
      c.created_at,
      u.full_name,
      u.email,
      u.phone,
      u.age,
      u.nationality,
      u.document,
      u.document_id,
      u.profile_image,
      u.base_salary,
      u.joining_date,
      b.building_name,
      f.floor_name,
      f.floor_number,
      sp.id             AS supervisor_profile_id,
      su.full_name      AS supervisor_name
    FROM cleaners c
    JOIN users u          ON c.user_id        = u.id
    LEFT JOIN buildings b ON c.building_id    = b.id
    LEFT JOIN floors    f ON c.floor_id       = f.id
    LEFT JOIN supervisors sp ON c.supervisor_id = sp.id
    LEFT JOIN users     su ON sp.user_id      = su.id
    WHERE u.role = 'cleaner'
    ORDER BY u.full_name ASC
  `);
  return rows;
};

// ─── GET BY ID (with date-filtered tasks/incentives/penalties) ────────────────
// NOTE: Tasks carry their own building_id/floor_id snapshot at creation time.
// Reassigning a cleaner to another building only affects future tasks —
// ALL historical task records remain fully accessible regardless of reassignment.

export const getCleanerByIdService = async (cleanerId: string, dateFilter?: string) => {
  const profileResult = await pool.query(
    `
    SELECT
      c.id              AS cleaner_id,
      c.user_id,
      c.building_id,
      c.floor_id,
      c.supervisor_id,
      c.total_tasks,
      c.total_earning,
      c.is_active,
      c.created_at,
      u.full_name,
      u.email,
      u.phone,
      u.age,
      u.nationality,
      u.document,
      u.document_id,
      u.profile_image,
      u.base_salary,
      u.joining_date,
      b.id              AS b_id,
      b.building_name,
      b.location        AS building_location,
      f.id              AS f_id,
      f.floor_name,
      f.floor_number,
      sp.id             AS supervisor_profile_id,
      su.full_name      AS supervisor_name
    FROM cleaners c
    JOIN users u          ON c.user_id        = u.id
    LEFT JOIN buildings b ON c.building_id    = b.id
    LEFT JOIN floors    f ON c.floor_id       = f.id
    LEFT JOIN supervisors sp ON c.supervisor_id = sp.id
    LEFT JOIN users     su ON sp.user_id      = su.id
    WHERE c.id = $1
  `,
    [cleanerId]
  );

  if (!profileResult.rows.length) return null;

  const row = profileResult.rows[0] as {
    cleaner_id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone: string | null;
    age: number | null;
    nationality: string | null;
    document: string | null;
    document_id: string | null;
    profile_image: string | null;
    base_salary: string;
    joining_date: string | null;
    is_active: boolean;
    total_tasks: string;
    total_earning: string;
    b_id: string | null;
    building_name: string | null;
    building_location: string | null;
    f_id: string | null;
    floor_name: string | null;
    floor_number: number | null;
    supervisor_profile_id: string | null;
    supervisor_name: string | null;
  };

  const dc = dateFilter ? `AND DATE(t.created_at) = $2` : '';
  const vals = dateFilter ? [cleanerId, dateFilter] : [cleanerId];

  const [tasksR, incR, penR] = await Promise.all([
    pool.query(
      `
      SELECT t.*, b.building_name, b.location AS building_location,
             f.floor_name, r.rating, r.comment
      FROM tasks t
      LEFT JOIN buildings b ON t.building_id = b.id
      LEFT JOIN floors    f ON t.floor_id    = f.id
      LEFT JOIN reviews   r ON r.task_id     = t.id
      WHERE t.cleaner_id = $1 ${dc}
      ORDER BY t.created_at DESC`,
      vals
    ),
    pool.query(
      `SELECT id, amount, reason, created_at FROM cleaner_incentives
      WHERE cleaner_id = $1 ${dateFilter ? 'AND DATE(created_at) = $2' : ''}
      ORDER BY created_at DESC`,
      vals
    ),
    pool.query(
      `SELECT id, amount, reason, created_at FROM penalties
      WHERE cleaner_id = $1 ${dateFilter ? 'AND DATE(created_at) = $2' : ''}
      ORDER BY created_at DESC`,
      vals
    ),
  ]);

  const totalTaskAmount = tasksR.rows.reduce(
    (s: number, t: { task_amount: string }) => s + Number(t.task_amount ?? 0),
    0
  );
  const totalIncentives = incR.rows.reduce(
    (s: number, i: { amount: string }) => s + Number(i.amount ?? 0),
    0
  );
  const totalPenalties = penR.rows.reduce(
    (s: number, p: { amount: string }) => s + Number(p.amount ?? 0),
    0
  );

  return {
    cleanerId: row.cleaner_id,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    age: row.age,
    nationality: row.nationality,
    document: row.document,
    documentId: row.document_id,
    profileImage: row.profile_image,
    baseSalary: Number(row.base_salary),
    joiningDate: row.joining_date,
    isActive: row.is_active,
    totalTasks: Number(row.total_tasks),
    totalEarning: Number(row.total_earning),
    building: row.b_id
      ? { id: row.b_id, name: row.building_name ?? '', location: row.building_location ?? '' }
      : null,
    floor: row.f_id
      ? { id: row.f_id, name: row.floor_name ?? '', number: row.floor_number ?? 0 }
      : null,
    supervisor: row.supervisor_profile_id
      ? { id: row.supervisor_profile_id, name: row.supervisor_name ?? '' }
      : null,
    summary: {
      totalTasks: tasksR.rowCount ?? 0,
      totalTaskAmount,
      totalIncentives,
      totalPenalties,
      netEarning: totalTaskAmount + totalIncentives - totalPenalties,
    },
    tasks: tasksR.rows,
    incentives: incR.rows,
    penalties: penR.rows,
  };
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export const updateCleanerService = async (cleanerId: string, data: UpdateCleanerData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cq = await client.query(`SELECT user_id FROM cleaners WHERE id = $1`, [cleanerId]);
    if (!cq.rows.length) {
      await client.query('ROLLBACK');
      return null;
    }
    const { user_id } = cq.rows[0] as { user_id: string };

    if (data.email) {
      const dup = await client.query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [
        data.email,
        user_id,
      ]);
      if (dup.rows.length) throw new AppError('Email already in use', 409, 'EMAIL_CONFLICT');
    }
    if (data.building_id) {
      const bck = await client.query(`SELECT id FROM buildings WHERE id = $1`, [data.building_id]);
      if (!bck.rows.length) throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
    }
    if (data.floor_id && data.building_id) {
      const fck = await client.query(`SELECT id FROM floors WHERE id = $1 AND building_id = $2`, [
        data.floor_id,
        data.building_id,
      ]);
      if (!fck.rows.length)
        throw new AppError('Floor does not belong to this building', 400, 'FLOOR_MISMATCH');
    }
    if (data.supervisor_id && data.building_id) {
      const sck = await client.query(
        `SELECT id FROM supervisors WHERE id = $1 AND building_id = $2`,
        [data.supervisor_id, data.building_id]
      );
      if (!sck.rows.length)
        throw new AppError(
          'Supervisor is not in the selected building',
          400,
          'SUPERVISOR_MISMATCH'
        );
    }

    // users table
    const uCols: string[] = ['updated_at = NOW()'];
    const uVals: (string | number | null)[] = [];
    let p = 1;
    for (const [key, col] of [
      ['full_name', 'full_name'],
      ['email', 'email'],
      ['phone', 'phone'],
      ['age', 'age'],
      ['nationality', 'nationality'],
      ['document_id', 'document_id'],
      ['document', 'document'],
      ['base_salary', 'base_salary'],
      ['profile_image', 'profile_image'],
    ] as [keyof UpdateCleanerData, string][]) {
      if (data[key] !== undefined) {
        uCols.push(`${col} = $${p++}`);
        uVals.push(data[key] as string | number | null);
      }
    }
    if (data.password) {
      const h = await bcrypt.hash(data.password, 10);
      uCols.push(`password = $${p++}`);
      uVals.push(h);
    }
    if (uCols.length > 1) {
      uVals.push(user_id);
      await client.query(`UPDATE users SET ${uCols.join(', ')} WHERE id = $${p}`, uVals);
    }

    // cleaners table
    const cCols: string[] = ['updated_at = NOW()'];
    const cVals: (string | number | boolean | null)[] = [];
    let cp = 1;
    if (data.building_id !== undefined) {
      cCols.push(`building_id   = $${cp++}`);
      cVals.push(data.building_id);
    }
    if (data.floor_id !== undefined) {
      cCols.push(`floor_id      = $${cp++}`);
      cVals.push(data.floor_id);
    }
    if (data.supervisor_id !== undefined) {
      cCols.push(`supervisor_id = $${cp++}`);
      cVals.push(data.supervisor_id);
    }
    if (data.is_active !== undefined) {
      cCols.push(`is_active     = $${cp++}`);
      cVals.push(data.is_active);
    }
    if (cCols.length > 1) {
      cVals.push(cleanerId);
      await client.query(`UPDATE cleaners SET ${cCols.join(', ')} WHERE id = $${cp}`, cVals);
    }

    await client.query('COMMIT');
    return await getCleanerByIdService(cleanerId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────────

export const toggleCleanerActiveService = async (cleanerId: string, isActive: boolean) => {
  const r = await pool.query(
    `UPDATE cleaners SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_active`,
    [isActive, cleanerId]
  );
  return r.rows.length ? (r.rows[0] as { id: string; is_active: boolean }) : null;
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const deleteCleanerService = async (cleanerId: string) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tc = await client.query(
      `SELECT COUNT(*) AS n FROM tasks WHERE cleaner_id = $1 AND status IN ('pending','in-progress')`,
      [cleanerId]
    );
    if (parseInt((tc.rows[0] as { n: string }).n) > 0)
      throw new AppError(
        'Cannot delete — cleaner has active or pending tasks. Reassign them first.',
        409,
        'CLEANER_HAS_TASKS'
      );
    const cq = await client.query(`SELECT user_id FROM cleaners WHERE id = $1`, [cleanerId]);
    if (!cq.rows.length) {
      await client.query('ROLLBACK');
      return null;
    }
    const { user_id } = cq.rows[0] as { user_id: string };
    await client.query(`DELETE FROM cleaners WHERE id = $1`, [cleanerId]);
    await client.query(`DELETE FROM users    WHERE id = $1`, [user_id]);
    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── DROPDOWN HELPERS (cascade in edit modal) ─────────────────────────────────

export const getFloorsByBuildingIdService = async (buildingId: string) => {
  const { rows } = await pool.query(
    `SELECT id, floor_name, floor_number FROM floors WHERE building_id = $1 ORDER BY floor_number ASC`,
    [buildingId]
  );
  return rows;
};

export const getSupervisorsByBuildingIdService = async (buildingId: string) => {
  const { rows } = await pool.query(
    `SELECT s.id, s.full_name, s.is_active FROM supervisors s WHERE s.building_id = $1 AND s.is_active = true ORDER BY s.full_name ASC`,
    [buildingId]
  );
  return rows;
};
