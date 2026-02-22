import { pool } from '../../database/connectDatabase';
import { AppError } from 'src/middlewares/error-handler';

// ============================================================
// TYPES
// ============================================================

export interface FloorInput {
  floor_number: number;
  floor_name: string;
  notes?: string;
}

export interface BuildingData {
  building_name: string;
  location?: string;
  latitude: number;
  longitude: number;
  radius?: number;
  floors?: FloorInput[];
}

export interface UpdateBuildingData {
  building_name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

// ============================================================
// CREATE
// ============================================================

export const createBuildingService = async (data: BuildingData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const buildingResult = await client.query(
      `INSERT INTO buildings (building_name, location, latitude, longitude, radius)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.building_name, data.location ?? null, data.latitude, data.longitude, data.radius ?? 100]
    );

    const building = buildingResult.rows[0];
    const floors: Record<string, unknown>[] = [];

    if (data.floors?.length) {
      for (const floor of data.floors) {
        const floorResult = await client.query(
          `INSERT INTO floors (building_id, floor_number, floor_name, notes)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [building.id, floor.floor_number, floor.floor_name, floor.notes ?? null]
        );
        floors.push(floorResult.rows[0]);
      }
    }

    await client.query('COMMIT');
    return { ...building, floors };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ============================================================
// READ — all buildings with stats (table view on main page)
// Returns: floors[], supervisor count (active/total),
//          cleaner count, revenue, created_at
// ============================================================

export const getAllBuildingsWithStatsService = async () => {
  const result = await pool.query(
    `SELECT
       b.id,
       b.building_name,
       b.location,
       b.latitude,
       b.longitude,
       b.radius,
       b.created_at,
       COALESCE(
         json_agg(
           json_build_object(
             'id',           f.id,
             'floor_number', f.floor_number,
             'floor_name',   f.floor_name
           ) ORDER BY f.floor_number
         ) FILTER (WHERE f.id IS NOT NULL),
         '[]'
       )                                                            AS floors,
       COUNT(DISTINCT c.id)::int                                   AS total_cleaners,
       COUNT(DISTINCT s.id)::int                                   AS total_supervisors,
       COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true)::int AS active_supervisors,
       COALESCE(SUM(t.final_price) FILTER (WHERE t.status = 'completed'), 0) AS total_revenue
     FROM buildings b
     LEFT JOIN floors      f ON f.building_id = b.id
     LEFT JOIN cleaners    c ON c.building_id = b.id
     LEFT JOIN supervisors s ON s.building_id = b.id
     LEFT JOIN tasks       t ON t.building_id = b.id
     GROUP BY b.id
     ORDER BY b.created_at DESC`
  );
  return result.rows;
};

// ============================================================
// READ — simple list for dropdowns
// ============================================================

export const getAllBuildingsService = async () => {
  const result = await pool.query(
    `SELECT id, building_name, location, latitude, longitude, radius, created_at
     FROM buildings
     ORDER BY building_name ASC`
  );
  return result.rows;
};

// ============================================================
// READ — single building with floors
// ============================================================

export const getBuildingByIdService = async (id: string) => {
  const result = await pool.query(
    `SELECT
       b.*,
       COALESCE(
         json_agg(
           json_build_object(
             'id',           f.id,
             'floor_number', f.floor_number,
             'floor_name',   f.floor_name,
             'notes',        f.notes,
             'created_at',   f.created_at
           ) ORDER BY f.floor_number
         ) FILTER (WHERE f.id IS NOT NULL),
         '[]'
       ) AS floors
     FROM buildings b
     LEFT JOIN floors f ON f.building_id = b.id
     WHERE b.id = $1
     GROUP BY b.id`,
    [id]
  );
  if (!result.rows.length) throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
  return result.rows[0];
};

// ============================================================
// READ — full building details for the details page
// Includes supervisors list, cleaner list, stats, revenue trend
// ============================================================

export const getBuildingDetailsService = async (id: string) => {
  const client = await pool.connect();
  try {
    // Building + floors
    const buildingResult = await client.query(
      `SELECT
         b.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id',           f.id,
               'floor_number', f.floor_number,
               'floor_name',   f.floor_name,
               'notes',        f.notes,
               'created_at',   f.created_at
             ) ORDER BY f.floor_number
           ) FILTER (WHERE f.id IS NOT NULL),
           '[]'
         ) AS floors
       FROM buildings b
       LEFT JOIN floors f ON f.building_id = b.id
       WHERE b.id = $1
       GROUP BY b.id`,
      [id]
    );
    if (!buildingResult.rows.length)
      throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
    const building = buildingResult.rows[0];

    // All supervisors in this building (active + inactive) for the edit panel
    const supervisorsResult = await client.query(
      `SELECT
         s.id,
         s.is_active,
         s.building_id,
         u.full_name,
         u.email,
         u.phone,
         u.profile_image
       FROM supervisors s
       JOIN users u ON s.user_id = u.id
       WHERE s.building_id = $1
       ORDER BY s.is_active DESC, u.full_name ASC`,
      [id]
    );

    // Counts
    const countsResult = await client.query(
      `SELECT
         COUNT(DISTINCT c.id)::int                                   AS cleaner_count,
         COUNT(DISTINCT s.id)::int                                   AS supervisor_count,
         COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true)::int AS active_supervisor_count
       FROM buildings b
       LEFT JOIN cleaners    c ON c.building_id = b.id
       LEFT JOIN supervisors s ON s.building_id = b.id
       WHERE b.id = $1`,
      [id]
    );

    // Revenue stats
    const revenueResult = await client.query(
      `SELECT
         COUNT(id)::int                    AS total_tasks,
         COALESCE(SUM(final_price), 0)     AS total_revenue,
         COALESCE(SUM(task_amount), 0)     AS total_task_amount
       FROM tasks
       WHERE building_id = $1 AND status = 'completed'`,
      [id]
    );

    // Cleaners list
    const cleanersResult = await client.query(
      `SELECT
         c.id,
         u.full_name,
         u.email,
         u.phone,
         u.profile_image,
         f.floor_name,
         COUNT(t.id)::int AS total_tasks
       FROM cleaners c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN floors f ON c.floor_id = f.id
       LEFT JOIN tasks  t ON t.cleaner_id = c.id AND t.status = 'completed'
       WHERE c.building_id = $1
       GROUP BY c.id, u.full_name, u.email, u.phone, u.profile_image, f.floor_name
       ORDER BY u.full_name ASC`,
      [id]
    );

    // Revenue trend (last 6 months)
    const trendResult = await client.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', completed_at), 'Mon YYYY') AS month,
         COALESCE(SUM(final_price), 0)                          AS revenue
       FROM tasks
       WHERE building_id = $1
         AND status = 'completed'
         AND completed_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', completed_at)
       ORDER BY DATE_TRUNC('month', completed_at) DESC`,
      [id]
    );

    const counts = countsResult.rows[0];
    const revenue = revenueResult.rows[0];

    return {
      ...building,
      supervisors: supervisorsResult.rows,
      statistics: {
        totalEmployees: counts.cleaner_count + counts.supervisor_count,
        totalCleaners: counts.cleaner_count,
        totalSupervisors: counts.supervisor_count,
        activeSupervisors: counts.active_supervisor_count,
        totalTasks: revenue.total_tasks,
        totalRevenue: parseFloat(revenue.total_revenue),
        totalTaskAmount: parseFloat(revenue.total_task_amount),
      },
      cleaners: cleanersResult.rows,
      revenueTrend: trendResult.rows,
    };
  } finally {
    client.release();
  }
};

// ============================================================
// READ — floors by building (registration dropdown)
// ============================================================

export const getFloorsByBuildingService = async (buildingId: string) => {
  const check = await pool.query(`SELECT id FROM buildings WHERE id = $1`, [buildingId]);
  if (!check.rows.length) throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');

  const result = await pool.query(
    `SELECT id, floor_number, floor_name, notes, building_id, created_at
     FROM floors
     WHERE building_id = $1
     ORDER BY floor_number ASC`,
    [buildingId]
  );
  return result.rows;
};

// ============================================================
// READ — active supervisors by building (registration dropdown)
// ============================================================

export const getSupervisorsByBuildingService = async (buildingId: string) => {
  const check = await pool.query(`SELECT id FROM buildings WHERE id = $1`, [buildingId]);
  if (!check.rows.length) throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');

  const result = await pool.query(
    `SELECT s.id, s.user_id, s.building_id, s.is_active, u.full_name, u.email, u.profile_image
     FROM supervisors s
     JOIN users u ON s.user_id = u.id
     WHERE s.building_id = $1
       AND s.is_active = true
     ORDER BY u.full_name ASC`,
    [buildingId]
  );
  return result.rows;
};

// ============================================================
// UPDATE — building info
// ============================================================

export const updateBuildingService = async (id: string, data: UpdateBuildingData) => {
  const fields: string[] = [];
  const values: (string | number)[] = [];
  let p = 1;

  if (data.building_name !== undefined) {
    fields.push(`building_name = $${p++}`);
    values.push(data.building_name);
  }
  if (data.location !== undefined) {
    fields.push(`location = $${p++}`);
    values.push(data.location);
  }
  if (data.latitude !== undefined) {
    fields.push(`latitude = $${p++}`);
    values.push(data.latitude);
  }
  if (data.longitude !== undefined) {
    fields.push(`longitude = $${p++}`);
    values.push(data.longitude);
  }
  if (data.radius !== undefined) {
    fields.push(`radius = $${p++}`);
    values.push(data.radius);
  }

  if (!fields.length)
    throw new AppError('No fields provided to update', 400, 'NO_FIELDS_TO_UPDATE');

  values.push(id);
  const result = await pool.query(
    `UPDATE buildings SET ${fields.join(', ')} WHERE id = $${p} RETURNING *`,
    values
  );
  if (!result.rows.length) throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
  return result.rows[0];
};

// ============================================================
// UPDATE — assign an existing supervisor to this building
//
// Use case: edit building page → pick a supervisor from the
// unassigned pool and add them to this building.
//
// The supervisor must exist. If they are already assigned to
// another building, their old building_id is overwritten.
// This is intentional — a supervisor belongs to one building
// at a time (supervisors.building_id is a single FK column).
// ============================================================

export const assignSupervisorToBuildingService = async (
  buildingId: string,
  supervisorId: string
) => {
  const building = await pool.query(`SELECT id FROM buildings WHERE id = $1`, [buildingId]);
  if (!building.rows.length) throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');

  const supervisor = await pool.query(`SELECT id, building_id FROM supervisors WHERE id = $1`, [
    supervisorId,
  ]);
  if (!supervisor.rows.length)
    throw new AppError('Supervisor not found', 404, 'SUPERVISOR_NOT_FOUND');

  if (supervisor.rows[0].building_id === buildingId) {
    throw new AppError(
      'Supervisor is already assigned to this building',
      409,
      'SUPERVISOR_ALREADY_IN_BUILDING'
    );
  }

  const result = await pool.query(
    `UPDATE supervisors
     SET building_id = $1, is_active = true, updated_at = now()
     WHERE id = $2
     RETURNING id, building_id, is_active, full_name`,
    [buildingId, supervisorId]
  );
  return result.rows[0];
};

// ============================================================
// UPDATE — remove supervisor from building
//
// Nullifies building_id + sets is_active = false.
// Does NOT cascade to their cleaners:
//   cleaners.supervisor_id FK is ON DELETE SET NULL, but this
//   is an UPDATE not a DELETE — the FK stays intact.
//   Cleaners keep their supervisor_id pointing at this row.
//   Only building + floor remain on the cleaner (snapshot columns).
// ============================================================

export const removeSupervisorFromBuildingService = async (
  buildingId: string,
  supervisorId: string
) => {
  const supervisor = await pool.query(`SELECT id, building_id FROM supervisors WHERE id = $1`, [
    supervisorId,
  ]);
  if (!supervisor.rows.length)
    throw new AppError('Supervisor not found', 404, 'SUPERVISOR_NOT_FOUND');
  if (supervisor.rows[0].building_id !== buildingId) {
    throw new AppError(
      'Supervisor does not belong to this building',
      400,
      'SUPERVISOR_NOT_IN_BUILDING'
    );
  }

  const result = await pool.query(
    `UPDATE supervisors
     SET building_id = NULL, is_active = false, updated_at = now()
     WHERE id = $1
     RETURNING id, building_id, is_active, full_name`,
    [supervisorId]
  );
  return result.rows[0];
};

// ============================================================
// UPDATE — toggle supervisor active / inactive within a building
// ============================================================

export const toggleSupervisorActiveService = async (buildingId: string, supervisorId: string) => {
  const supervisor = await pool.query(
    `SELECT id, building_id, is_active FROM supervisors WHERE id = $1`,
    [supervisorId]
  );
  if (!supervisor.rows.length)
    throw new AppError('Supervisor not found', 404, 'SUPERVISOR_NOT_FOUND');
  if (supervisor.rows[0].building_id !== buildingId) {
    throw new AppError(
      'Supervisor does not belong to this building',
      400,
      'SUPERVISOR_NOT_IN_BUILDING'
    );
  }

  const result = await pool.query(
    `UPDATE supervisors
     SET is_active = NOT is_active, updated_at = now()
     WHERE id = $1
     RETURNING id, building_id, is_active, full_name`,
    [supervisorId]
  );
  return result.rows[0];
};

// ============================================================
// DELETE
// ============================================================

export const deleteBuildingService = async (id: string) => {
  const result = await pool.query(`DELETE FROM buildings WHERE id = $1 RETURNING *`, [id]);
  if (!result.rows.length) throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
  return result.rows[0];
};

export const getUnassignedSupervisorsService = async () => {
  const result = await pool.query(
    `SELECT
       s.id,
       s.user_id,
       s.is_active,
       u.full_name,
       u.email,
       u.profile_image
     FROM supervisors s
     JOIN users u ON s.user_id = u.id
     WHERE s.building_id IS NULL
     ORDER BY u.full_name ASC`
  );
  return result.rows;
};
