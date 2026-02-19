import { pool } from '../../database/connectDatabase';
import bcrypt from 'bcrypt';
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
  password?: string; // In case admin wants to reset password
}

export const getSupervisorWorkersService = async (supervisorId: string) => {
  const result = await pool.query(
    `
    SELECT u.id, u.full_name, u.email, u.role
    FROM supervisor_workers sw
    JOIN users u ON u.id = sw.worker_id
    WHERE sw.supervisor_id=$1
    `,
    [supervisorId]
  );
  return result.rows;
};

export const supervisorReportService = async (supervisorId: string, period: string) => {
  let filter = '';
  if (period === 'day') filter = `t.completed_at::date = CURRENT_DATE`;
  else if (period === 'week') filter = `t.completed_at >= date_trunc('week', NOW())`;
  else filter = `t.completed_at >= date_trunc('month', NOW())`;

  const result = await pool.query(
    `
    SELECT 
      u.id as worker_id,
      u.full_name,
      COUNT(t.id)::int as total_tasks
    FROM tasks t
    JOIN supervisor_workers sw ON sw.worker_id = t.worker_id
    JOIN users u ON u.id = t.worker_id
    WHERE sw.supervisor_id=$1
      AND t.status='completed'
      AND ${filter}
    GROUP BY u.id, u.full_name
    ORDER BY total_tasks DESC
    `,
    [supervisorId]
  );

  return result.rows;
};

// Get supervisor details (your existing code)
export const getSupervisorDetailsService = async (supervisorId: string) => {
  try {
    const query = `
      SELECT 
        s.id AS supervisor_id,
        s.full_name AS supervisor_full_name,
        s.is_active,

        su.email AS supervisor_email,
        su.phone AS supervisor_phone,
        su.base_salary AS supervisor_base_salary,
        su.nationality,
        su.document_id,
        su.profile_image,
        su.age,
        su.document,
        su.joining_date,

        b.id AS building_id,
        b.building_name,

        c.id AS cleaner_id,
        c.cleaner_full_name,
        c.incentive_target,
        c.total_tasks,
        c.total_earning,
        
        cu.email AS cleaner_email,
        cu.base_salary AS cleaner_base_salary,

        f.id AS floor_id,
        f.floor_number

      FROM supervisors s
      JOIN users su ON s.user_id = su.id
      LEFT JOIN buildings b ON s.building_id = b.id
      LEFT JOIN cleaners c ON c.supervisor_id = s.id
      LEFT JOIN users cu ON c.user_id = cu.id
      LEFT JOIN floors f ON c.floor_id = f.id
      WHERE s.id = $1
    `;

    const result = await pool.query(query, [supervisorId]);

    if (result.rows.length === 0) {
      return null;
    }

    const supervisorRow = result.rows[0];

    // Group cleaners and avoid duplicates
    const cleanersMap = new Map();

    result.rows.forEach((row) => {
      if (row.cleaner_id && !cleanersMap.has(row.cleaner_id)) {
        cleanersMap.set(row.cleaner_id, {
          id: row.cleaner_id,
          full_name: row.cleaner_full_name,
          email: row.cleaner_email,
          total_tasks: Number(row.total_tasks) || 0,
          total_earning: Number(row.total_earning) || 0,
          base_salary: Number(row.cleaner_base_salary) || 0,
          incentive_target: Number(row.incentive_target) || 0,
          floor: row.floor_id
            ? {
                id: row.floor_id,
                floor_number: row.floor_number,
              }
            : null,
        });
      }
    });

    const cleaners = Array.from(cleanersMap.values());

    return {
      id: supervisorRow.supervisor_id,
      full_name: supervisorRow.supervisor_full_name,
      email: supervisorRow.supervisor_email,
      phone: supervisorRow.supervisor_phone,
      base_salary: Number(supervisorRow.supervisor_base_salary) || 0,
      nationality: supervisorRow.nationality,
      document_id: supervisorRow.document_id,
      profile_image: supervisorRow.profile_image,
      age: supervisorRow.age,
      document: supervisorRow.document,
      joining_date: supervisorRow.joining_date,
      is_active: supervisorRow.is_active,
      building: supervisorRow.building_id
        ? {
            id: supervisorRow.building_id,
            name: supervisorRow.building_name,
          }
        : null,
      cleaners,
    };
  } catch (error) {
    console.error('Database error in getSupervisorDetailsService:', error);
    throw error;
  }
};

// Update supervisor
export const updateSupervisorService = async (
  supervisorId: string,
  updateData: UpdateSupervisorData
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // First, get the supervisor's user_id
    const supervisorQuery = await client.query(
      'SELECT user_id, building_id FROM supervisors WHERE id = $1',
      [supervisorId]
    );

    if (supervisorQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const { user_id, building_id: currentBuildingId } = supervisorQuery.rows[0];

    // Check if building exists if building_id is being updated
    if (updateData.building_id && updateData.building_id !== currentBuildingId) {
      const buildingCheck = await client.query('SELECT id FROM buildings WHERE id = $1', [
        updateData.building_id,
      ]);

      if (buildingCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Building not found');
      }
    }

    // Check if email is being changed and if it already exists
    if (updateData.email) {
      const emailCheck = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [
        updateData.email,
        user_id,
      ]);

      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('Email already exists');
      }
    }

    // Build dynamic update query for users table
    const userUpdates: string[] = [];
    const userValues: (string | number | Buffer | null)[] = [];
    let userParamCount = 1;

    if (updateData.full_name !== undefined) {
      userUpdates.push(`full_name = $${userParamCount++}`);
      userValues.push(updateData.full_name);
    }
    if (updateData.email !== undefined) {
      userUpdates.push(`email = $${userParamCount++}`);
      userValues.push(updateData.email);
    }
    if (updateData.phone !== undefined) {
      userUpdates.push(`phone = $${userParamCount++}`);
      userValues.push(updateData.phone);
    }
    if (updateData.age !== undefined) {
      userUpdates.push(`age = $${userParamCount++}`);
      userValues.push(updateData.age);
    }
    if (updateData.nationality !== undefined) {
      userUpdates.push(`nationality = $${userParamCount++}`);
      userValues.push(updateData.nationality);
    }
    if (updateData.document_id !== undefined) {
      userUpdates.push(`document_id = $${userParamCount++}`);
      userValues.push(updateData.document_id);
    }
    if (updateData.document !== undefined) {
      userUpdates.push(`document = $${userParamCount++}`);
      userValues.push(updateData.document);
    }
    if (updateData.base_salary !== undefined) {
      userUpdates.push(`base_salary = $${userParamCount++}`);
      userValues.push(updateData.base_salary);
    }
    if (updateData.profile_image !== undefined) {
      userUpdates.push(`profile_image = $${userParamCount++}`);
      userValues.push(updateData.profile_image);
    }
    if (updateData.building_id !== undefined) {
      userUpdates.push(`building_id = $${userParamCount++}`);
      userValues.push(updateData.building_id);
    }
    if (updateData.password !== undefined) {
      // Hash password before storing (use bcrypt in production)
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      userUpdates.push(`password = $${userParamCount++}`);
      userValues.push(hashedPassword);
    }

    // Always update updated_at
    userUpdates.push(`updated_at = NOW()`);

    // Update users table if there are changes
    if (userUpdates.length > 1) {
      // More than just updated_at
      userValues.push(user_id);
      const userUpdateQuery = `
        UPDATE users 
        SET ${userUpdates.join(', ')}
        WHERE id = $${userParamCount}
        RETURNING *
      `;

      await client.query(userUpdateQuery, userValues);
    }

    // Update supervisors table if building_id changed
    if (updateData.building_id !== undefined) {
      await client.query(
        `UPDATE supervisors 
         SET building_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [updateData.building_id, supervisorId]
      );
    }

    // Update supervisor's full_name in supervisors table if changed
    if (updateData.full_name !== undefined) {
      await client.query(
        `UPDATE supervisors 
         SET full_name = $1, updated_at = NOW()
         WHERE id = $2`,
        [updateData.full_name, supervisorId]
      );
    }

    await client.query('COMMIT');

    // Return updated supervisor details
    return await getSupervisorDetailsService(supervisorId);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error in updateSupervisorService:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Toggle supervisor active/inactive status
export const toggleSupervisorStatusService = async (supervisorId: string, isActive: boolean) => {
  try {
    const query = `
      UPDATE supervisors 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, is_active
    `;

    const result = await pool.query(query, [isActive, supervisorId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Database error in toggleSupervisorStatusService:', error);
    throw error;
  }
};

// Delete supervisor
export const deleteSupervisorService = async (supervisorId: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if supervisor has assigned cleaners
    const cleanersCheck = await client.query(
      'SELECT COUNT(*) as count FROM cleaners WHERE supervisor_id = $1',
      [supervisorId]
    );

    if (parseInt(cleanersCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      throw new Error('Supervisor has assigned cleaners');
    }

    // Get the user_id before deleting supervisor
    const supervisorQuery = await client.query('SELECT user_id FROM supervisors WHERE id = $1', [
      supervisorId,
    ]);

    if (supervisorQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const { user_id } = supervisorQuery.rows[0];

    // Delete from supervisors table
    await client.query('DELETE FROM supervisors WHERE id = $1', [supervisorId]);

    // Delete from users table
    await client.query('DELETE FROM users WHERE id = $1', [user_id]);

    await client.query('COMMIT');

    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error in deleteSupervisorService:', error);
    throw error;
  } finally {
    client.release();
  }
};
