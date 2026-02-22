import { pool } from '../../database/connectDatabase';
import bcrypt from 'bcrypt';
import { AppError } from 'src/middlewares/error-handler';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdateSupervisorData {
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

// ─── GET ALL ──────────────────────────────────────────────────────────────────

export const getAllSupervisorsService = async () => {
  const result = await pool.query(
    `SELECT
       s.id              AS supervisor_id,
       s.full_name,
       s.is_active,
       s.building_id,
       s.updated_at,
       u.email,
       u.phone,
       u.profile_image,
       u.joining_date,
       u.base_salary,
       b.building_name,
       COUNT(DISTINCT c.id)::int AS cleaner_count
     FROM supervisors s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN buildings b ON s.building_id = b.id
     LEFT JOIN cleaners  c ON c.supervisor_id = s.id
     GROUP BY s.id, u.email, u.phone, u.profile_image, u.joining_date, u.base_salary, b.building_name
     ORDER BY s.full_name ASC`
  );
  return result.rows;
};

// ─── GET UNASSIGNED ───────────────────────────────────────────────────────────

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

// ─── GET DETAILS (existing — preserved exactly) ───────────────────────────────

export const getSupervisorDetailsService = async (supervisorId: string) => {
  const query = `
    SELECT
      s.id              AS supervisor_id,
      s.full_name       AS supervisor_full_name,
      s.is_active,

      su.email          AS supervisor_email,
      su.phone          AS supervisor_phone,
      su.base_salary    AS supervisor_base_salary,
      su.nationality,
      su.document_id,
      su.profile_image,
      su.age,
      su.document,
      su.joining_date,

      b.id              AS building_id,
      b.building_name,

      c.id              AS cleaner_id,
      cu.full_name      AS cleaner_full_name,
      c.total_tasks,
      c.total_earning,

      cu.email          AS cleaner_email,
      cu.base_salary    AS cleaner_base_salary,

      f.id              AS floor_id,
      f.floor_number
    FROM supervisors s
    JOIN users su ON s.user_id = su.id
    LEFT JOIN buildings b  ON s.building_id  = b.id
    LEFT JOIN cleaners  c  ON c.supervisor_id = s.id
    LEFT JOIN users     cu ON c.user_id       = cu.id
    LEFT JOIN floors    f  ON c.floor_id      = f.id
    WHERE s.id = $1
  `;
  console.log('query,', query);

  const result = await pool.query(query, [supervisorId]);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];

  const cleanersMap = new Map<
    string,
    {
      id: string;
      full_name: string;
      email: string;
      total_tasks: number;
      total_earning: number;
      base_salary: number;
      floor: { id: string; floor_number: number } | null;
    }
  >();

  result.rows.forEach((r) => {
    if (r.cleaner_id && !cleanersMap.has(r.cleaner_id)) {
      cleanersMap.set(r.cleaner_id, {
        id: r.cleaner_id,
        full_name: r.cleaner_full_name,
        email: r.cleaner_email,
        total_tasks: Number(r.total_tasks) || 0,
        total_earning: Number(r.total_earning) || 0,
        base_salary: Number(r.cleaner_base_salary) || 0,
        floor: r.floor_id ? { id: r.floor_id, floor_number: r.floor_number } : null,
      });
    }
  });

  return {
    id: row.supervisor_id,
    full_name: row.supervisor_full_name,
    email: row.supervisor_email,
    phone: row.supervisor_phone,
    base_salary: Number(row.supervisor_base_salary) || 0,
    nationality: row.nationality,
    document_id: row.document_id,
    profile_image: row.profile_image,
    age: row.age,
    document: row.document,
    joining_date: row.joining_date,
    is_active: row.is_active,
    building: row.building_id ? { id: row.building_id, name: row.building_name } : null,
    cleaners: Array.from(cleanersMap.values()),
  };
};

// ─── UPDATE (existing — preserved, console.error → throw) ────────────────────

export const updateSupervisorService = async (
  supervisorId: string,
  updateData: UpdateSupervisorData
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const supervisorQuery = await client.query(
      'SELECT user_id, building_id FROM supervisors WHERE id = $1',
      [supervisorId]
    );
    if (supervisorQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const { user_id, building_id: currentBuildingId } = supervisorQuery.rows[0] as {
      user_id: string;
      building_id: string | null;
    };

    if (updateData.building_id && updateData.building_id !== currentBuildingId) {
      const buildingCheck = await client.query('SELECT id FROM buildings WHERE id = $1', [
        updateData.building_id,
      ]);
      if (buildingCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
      }
    }

    if (updateData.email) {
      const emailCheck = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [
        updateData.email,
        user_id,
      ]);
      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new AppError('Email already in use', 409, 'EMAIL_CONFLICT');
      }
    }

    const userUpdates: string[] = [];
    const userValues: (string | number | null)[] = [];
    let p = 1;

    if (updateData.full_name !== undefined) {
      userUpdates.push(`full_name    = $${p++}`);
      userValues.push(updateData.full_name);
    }
    if (updateData.email !== undefined) {
      userUpdates.push(`email        = $${p++}`);
      userValues.push(updateData.email);
    }
    if (updateData.phone !== undefined) {
      userUpdates.push(`phone        = $${p++}`);
      userValues.push(updateData.phone);
    }
    if (updateData.age !== undefined) {
      userUpdates.push(`age          = $${p++}`);
      userValues.push(updateData.age);
    }
    if (updateData.nationality !== undefined) {
      userUpdates.push(`nationality  = $${p++}`);
      userValues.push(updateData.nationality);
    }
    if (updateData.document_id !== undefined) {
      userUpdates.push(`document_id  = $${p++}`);
      userValues.push(updateData.document_id);
    }
    if (updateData.document !== undefined) {
      userUpdates.push(`document     = $${p++}`);
      userValues.push(updateData.document);
    }
    if (updateData.base_salary !== undefined) {
      userUpdates.push(`base_salary  = $${p++}`);
      userValues.push(updateData.base_salary);
    }
    if (updateData.profile_image !== undefined) {
      userUpdates.push(`profile_image = $${p++}`);
      userValues.push(updateData.profile_image);
    }
    if (updateData.building_id !== undefined) {
      userUpdates.push(`building_id  = $${p++}`);
      userValues.push(updateData.building_id);
    }

    if (updateData.password !== undefined) {
      const hashed = await bcrypt.hash(updateData.password, 10);
      userUpdates.push(`password = $${p++}`);
      userValues.push(hashed);
    }

    userUpdates.push(`updated_at = NOW()`);

    if (userUpdates.length > 1) {
      userValues.push(user_id);
      await client.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${p}`, userValues);
    }

    const supUpdates: string[] = ['updated_at = NOW()'];
    const supValues: (string | number | boolean)[] = [];
    let sp = 1;

    if (updateData.building_id !== undefined) {
      supUpdates.push(`building_id = $${sp++}`);
      supValues.push(updateData.building_id);
    }
    if (updateData.full_name !== undefined) {
      supUpdates.push(`full_name   = $${sp++}`);
      supValues.push(updateData.full_name);
    }

    supValues.push(supervisorId);
    await client.query(
      `UPDATE supervisors SET ${supUpdates.join(', ')} WHERE id = $${sp}`,
      supValues
    );

    await client.query('COMMIT');
    return await getSupervisorDetailsService(supervisorId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────

export const toggleSupervisorStatusService = async (supervisorId: string, isActive: boolean) => {
  const result = await pool.query(
    `UPDATE supervisors SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_active`,
    [isActive, supervisorId]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0] as { id: string; is_active: boolean };
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const deleteSupervisorService = async (supervisorId: string) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cleanersCheck = await client.query(
      'SELECT COUNT(*) AS count FROM cleaners WHERE supervisor_id = $1',
      [supervisorId]
    );
    if (parseInt((cleanersCheck.rows[0] as { count: string }).count) > 0) {
      await client.query('ROLLBACK');
      throw new AppError(
        'Cannot delete supervisor — they still have assigned cleaners. Reassign them first.',
        409,
        'SUPERVISOR_HAS_CLEANERS'
      );
    }

    const supQuery = await client.query('SELECT user_id FROM supervisors WHERE id = $1', [
      supervisorId,
    ]);
    if (supQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const { user_id } = supQuery.rows[0] as { user_id: string };
    await client.query('DELETE FROM supervisors WHERE id = $1', [supervisorId]);
    await client.query('DELETE FROM users WHERE id = $1', [user_id]);

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ─── AVAILABLE CLEANERS (no supervisor) ──────────────────────────────────────

export const getAvailableCleanersService = async () => {
  const result = await pool.query(
    `SELECT
       c.id,
       c.incentive_target,
       u.full_name,
       u.email,
       u.phone,
       u.profile_image,
       c.building_id,
       b.building_name,
       f.id          AS floor_id,
       f.floor_name,
       f.floor_number
     FROM cleaners c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN buildings b ON c.building_id = b.id
     LEFT JOIN floors    f ON c.floor_id    = f.id
     WHERE c.supervisor_id IS NULL
     ORDER BY u.full_name ASC`
  );
  return result.rows;
};

// ─── ASSIGN CLEANER TO SUPERVISOR ────────────────────────────────────────────

export const assignCleanerToSupervisorService = async (supervisorId: string, cleanerId: string) => {
  // Verify supervisor exists
  const supCheck = await pool.query('SELECT id FROM supervisors WHERE id = $1', [supervisorId]);
  if (!supCheck.rows.length)
    throw new AppError('Supervisor not found', 404, 'SUPERVISOR_NOT_FOUND');

  // Verify cleaner exists and is unassigned
  const cleanerCheck = await pool.query('SELECT id, supervisor_id FROM cleaners WHERE id = $1', [
    cleanerId,
  ]);
  if (!cleanerCheck.rows.length) throw new AppError('Cleaner not found', 404, 'CLEANER_NOT_FOUND');

  const row = cleanerCheck.rows[0] as { id: string; supervisor_id: string | null };
  if (row.supervisor_id !== null)
    throw new AppError(
      'Cleaner is already assigned to a supervisor',
      409,
      'CLEANER_ALREADY_ASSIGNED'
    );

  const result = await pool.query(
    'UPDATE cleaners SET supervisor_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id, supervisor_id',
    [supervisorId, cleanerId]
  );
  return result.rows[0] as { id: string; supervisor_id: string };
};

// ─── REMOVE CLEANER FROM SUPERVISOR ──────────────────────────────────────────

export const removeCleanerFromSupervisorService = async (
  supervisorId: string,
  cleanerId: string
) => {
  const cleanerCheck = await pool.query('SELECT id, supervisor_id FROM cleaners WHERE id = $1', [
    cleanerId,
  ]);
  if (!cleanerCheck.rows.length) throw new AppError('Cleaner not found', 404, 'CLEANER_NOT_FOUND');

  const row = cleanerCheck.rows[0] as { id: string; supervisor_id: string | null };
  if (row.supervisor_id !== supervisorId)
    throw new AppError('Cleaner does not belong to this supervisor', 400, 'CLEANER_MISMATCH');

  await pool.query('UPDATE cleaners SET supervisor_id = NULL, updated_at = NOW() WHERE id = $1', [
    cleanerId,
  ]);
  return { success: true };
};
