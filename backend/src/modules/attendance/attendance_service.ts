import { pool } from '../../database/connectDatabase';

// ============================================================
// CLASS-BASED (Admin/Supervisor) Attendance Service – athulya
// ============================================================

type UserRole = 'admin' | 'accountant' | 'supervisor' | 'worker';

export class AttendanceService {
  static async markOnLogin(data: { user_id: string; role: UserRole }) {
    const now = new Date();

    const lateTime = new Date();
    lateTime.setHours(9, 30, 0);

    const status = now > lateTime ? 'late' : 'present';

    const result = await pool.query(
      `
      INSERT INTO attendance(user_id, check_in, status)
      VALUES ($1,NOW(),$2)
      ON CONFLICT (user_id, date)
      DO NOTHING
      RETURNING *
      `,
      [data.user_id, status]
    );

    return result.rows[0];
  }

  static async clockOut(user_id: string) {
    const attendance = await pool.query(
      `
      SELECT check_in
      FROM attendance
      WHERE user_id=$1 AND date=CURRENT_DATE
      `,
      [user_id]
    );

    if (!attendance.rows.length) return null;

    const checkIn = attendance.rows[0].check_in;

    await pool.query(
      `
      UPDATE attendance
      SET check_out=NOW()
      WHERE user_id=$1 AND date=CURRENT_DATE
      `,
      [user_id]
    );

    const hours = (Date.now() - new Date(checkIn).getTime()) / 3600000;

    return hours.toFixed(2);
  }

  static async today() {
    const result = await pool.query(`
      SELECT u.full_name,a.*
      FROM attendance a
      JOIN users u ON u.id=a.user_id
      WHERE date=CURRENT_DATE
    `);

    return result.rows;
  }

  static async alreadyMarked(user_id: string): Promise<boolean> {
    const result = await pool.query(
      `
      SELECT id FROM attendance
      WHERE user_id=$1 AND date=CURRENT_DATE
      `,
      [user_id]
    );

    return result.rows.length > 0;
  }
}

// ============================================================
// FUNCTIONAL (Mobile Worker) Attendance Service – Sahileyy
// ============================================================

// Calculate distance between two GPS coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const checkTodayAttendance = async (workerId: string) => {
  const query = `
    SELECT * FROM attendance
    WHERE worker_id = $1 AND date = CURRENT_DATE
    LIMIT 1
  `;
  const result = await pool.query(query, [workerId]);
  return result.rows[0] || null;
};

export type MarkAttendanceData = {
  workerId: string;
  cleanerId: string | null;
  buildingId: string;
  supervisorId: string | null;
  latitude: number;
  longitude: number;
};

export const markAttendance = async (data: MarkAttendanceData) => {
  // Check if already marked today
  const existing = await checkTodayAttendance(data.workerId);
  if (existing) {
    throw new Error('Attendance already marked for today');
  }

  // Get building location and radius
  const buildingQuery = `
    SELECT latitude, longitude, radius 
    FROM buildings 
    WHERE id = $1
  `;
  const buildingResult = await pool.query(buildingQuery, [data.buildingId]);

  if (!buildingResult.rows.length) {
    throw new Error('Building not found');
  }

  const building = buildingResult.rows[0];

  // Only validate GPS distance if the building has GPS coordinates set
  if (building.latitude != null && building.longitude != null) {
    const distance = calculateDistance(
      building.latitude,
      building.longitude,
      data.latitude,
      data.longitude
    );

    // Check if within radius (default 100m)
    const allowedRadius = building.radius || 100;
    if (distance > allowedRadius) {
      throw new Error(
        `You must be within ${allowedRadius}m of the building to mark attendance. Current distance: ${Math.round(distance)}m`
      );
    }
  }

  // Validate supervisor exists or set to NULL
  let validSupervisorId = data.supervisorId;
  if (data.supervisorId) {
    const supervisorCheck = await pool.query('SELECT id FROM users WHERE id = $1', [
      data.supervisorId,
    ]);
    if (supervisorCheck.rows.length === 0) {
      console.warn(`Supervisor ${data.supervisorId} not found, setting to NULL`);
      validSupervisorId = null;
    }
  }

  // Mark attendance
  const insertQuery = `
    INSERT INTO attendance 
    (worker_id, cleaner_id, building_id, supervisor_id, latitude, longitude, date)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
    RETURNING *
  `;

  const result = await pool.query(insertQuery, [
    data.workerId,
    data.cleanerId,
    data.buildingId,
    validSupervisorId,
    data.latitude,
    data.longitude,
  ]);

  return result.rows[0];
};

export const getAttendanceCalendar = async (workerId: string, month: number, year: number) => {
  const query = `
    SELECT date, check_in_time
    FROM attendance
    WHERE worker_id = $1
      AND EXTRACT(MONTH FROM date) = $2
      AND EXTRACT(YEAR FROM date) = $3
    ORDER BY date ASC
  `;

  const result = await pool.query(query, [workerId, month, year]);
  return result.rows;
};

export const getUserAttendanceInfo = async (userId: string, role: string) => {
  try {
    if (role === 'supervisor') {
      const query = `
        SELECT 
          u.full_name as worker_name,
          NULL as cleaner_id,
          s.building_id,
          b.building_name,
          u.full_name as supervisor_name,
          NULL as supervisor_id
        FROM users u
        JOIN supervisors s ON u.id = s.user_id
        LEFT JOIN buildings b ON s.building_id = b.id
        WHERE u.id = $1
      `;
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } else {
      const query = `
        SELECT 
          u.full_name as worker_name,
          c.id as cleaner_id,
          c.building_id,
          b.building_name,
          sup.full_name as supervisor_name,
          c.supervisor_id
        FROM users u
        JOIN cleaners c ON u.id = c.user_id
        LEFT JOIN buildings b ON c.building_id = b.id
        LEFT JOIN users sup ON c.supervisor_id = sup.id
        WHERE u.id = $1
      `;
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    }
  } catch (error) {
    console.error('getUserAttendanceInfo SQL Error:', error);
    throw error;
  }
};
