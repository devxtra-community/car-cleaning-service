"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupervisorService = exports.toggleSupervisorStatusService = exports.updateSupervisorService = exports.getSupervisorDetailsService = exports.supervisorReportService = exports.updateWorkerAssignmentService = exports.getSupervisorWorkersAttendanceService = exports.getSupervisorWorkersService = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getSupervisorWorkersService = async (supervisorId) => {
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      u.id, 
      c.id AS cleaner_id,
      u.full_name, 
      u.email, 
      u.role,
      t.id AS current_task_id,
      t.owner_name,
      t.owner_phone,
      t.car_number,
      t.car_model,
      t.car_type,
      t.car_color,
      t.car_color,
      t.amount_charged AS task_amount,
      t.created_at AS task_started_at,
      CASE WHEN t.id IS NOT NULL THEN 'working' ELSE 'idle' END AS status
    FROM cleaners c
    JOIN users u ON u.id = c.user_id
    JOIN supervisors s ON c.supervisor_id = s.id
    LEFT JOIN LATERAL (
      SELECT * FROM tasks 
      WHERE cleaner_id = c.id AND status != 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    ) t ON true
    WHERE s.user_id = $1
    ORDER BY status DESC, u.full_name ASC
    `, [supervisorId]);
    return result.rows;
};
exports.getSupervisorWorkersService = getSupervisorWorkersService;
const getSupervisorWorkersAttendanceService = async (supervisorId) => {
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      u.id, 
      u.full_name,
      a.id AS attendance_id,
      a.date,
      a.created_at AS check_in_time,
      CASE WHEN a.id IS NOT NULL THEN 'present' ELSE 'absent' END AS attendance_status
    FROM cleaners c
    JOIN users u ON u.id = c.user_id
    JOIN supervisors s ON c.supervisor_id = s.id
    LEFT JOIN attendance a ON a.worker_id = u.id AND a.date = CURRENT_DATE
    WHERE s.user_id = $1
    ORDER BY u.full_name ASC
    `, [supervisorId]);
    return result.rows;
};
exports.getSupervisorWorkersAttendanceService = getSupervisorWorkersAttendanceService;
const updateWorkerAssignmentService = async (cleanerId, floorId) => {
    const result = await connectDatabase_1.pool.query(`UPDATE cleaners SET floor_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [floorId, cleanerId]);
    return result.rows[0];
};
exports.updateWorkerAssignmentService = updateWorkerAssignmentService;
const supervisorReportService = async (supervisorId, period) => {
    let filter = '';
    if (period === 'day')
        filter = `t.completed_at::date = CURRENT_DATE`;
    else if (period === 'week')
        filter = `t.completed_at >= date_trunc('week', NOW())`;
    else
        filter = `t.completed_at >= date_trunc('month', NOW())`;
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      u.id as worker_id,
      u.full_name,
      COUNT(t.id)::int as total_tasks
    FROM tasks t
    JOIN cleaners c ON c.id = t.cleaner_id
    JOIN users u ON u.id = c.user_id
    JOIN supervisors s ON c.supervisor_id = s.id
    WHERE s.user_id=$1
      AND t.status='completed'
      AND ${filter}
    GROUP BY u.id, u.full_name
    ORDER BY total_tasks DESC
    `, [supervisorId]);
    return result.rows;
};
exports.supervisorReportService = supervisorReportService;
// Get supervisor details (your existing code)
const getSupervisorDetailsService = async (supervisorId) => {
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
        const result = await connectDatabase_1.pool.query(query, [supervisorId]);
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
    }
    catch (error) {
        console.error('Database error in getSupervisorDetailsService:', error);
        throw error;
    }
};
exports.getSupervisorDetailsService = getSupervisorDetailsService;
// Update supervisor
const updateSupervisorService = async (supervisorId, updateData) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        // First, get the supervisor's user_id
        const supervisorQuery = await client.query('SELECT user_id, building_id FROM supervisors WHERE id = $1', [supervisorId]);
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
        const userUpdates = [];
        const userValues = [];
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
            const hashedPassword = await bcrypt_1.default.hash(updateData.password, 10);
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
            await client.query(`UPDATE supervisors 
         SET building_id = $1, updated_at = NOW()
         WHERE id = $2`, [updateData.building_id, supervisorId]);
        }
        // Update supervisor's full_name in supervisors table if changed
        if (updateData.full_name !== undefined) {
            await client.query(`UPDATE supervisors 
         SET full_name = $1, updated_at = NOW()
         WHERE id = $2`, [updateData.full_name, supervisorId]);
        }
        await client.query('COMMIT');
        // Return updated supervisor details
        return await (0, exports.getSupervisorDetailsService)(supervisorId);
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Database error in updateSupervisorService:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.updateSupervisorService = updateSupervisorService;
// Toggle supervisor active/inactive status
const toggleSupervisorStatusService = async (supervisorId, isActive) => {
    try {
        const query = `
      UPDATE supervisors 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, is_active
    `;
        const result = await connectDatabase_1.pool.query(query, [isActive, supervisorId]);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Database error in toggleSupervisorStatusService:', error);
        throw error;
    }
};
exports.toggleSupervisorStatusService = toggleSupervisorStatusService;
// Delete supervisor
const deleteSupervisorService = async (supervisorId) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Check if supervisor has assigned cleaners
        const cleanersCheck = await client.query('SELECT COUNT(*) as count FROM cleaners WHERE supervisor_id = $1', [supervisorId]);
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Database error in deleteSupervisorService:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.deleteSupervisorService = deleteSupervisorService;
