import { Response } from 'express';
import { Pool } from 'pg';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { logAuditAction } from '../../utils/auditLogger';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

/* ================= SUPERVISOR: GET PENDING FRAUD CASES ================= */
export const getPendingFraudCases = async (req: AuthRequest, res: Response) => {
    try {
        const supervisorId = req.user?.userId;

        // Get building from supervisor record
        const supervisorRes = await pool.query(
            'SELECT building_id FROM supervisors WHERE user_id = $1',
            [supervisorId]
        );
        if (!supervisorRes.rows.length) return res.json({ success: true, data: [] });
        const buildingId = supervisorRes.rows[0].building_id;

        const result = await pool.query(
            `SELECT 
        f.id, f.type, f.status, f.created_at,
        t.car_number, t.car_type, t.id as task_id,
        t.before_wash_image_url, t.after_wash_image_url,
        u.full_name as cleaner_name
       FROM fraud_cases f
       JOIN tasks t ON f.task_id = t.id
       JOIN cleaners c ON f.cleaner_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE c.building_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
            [buildingId]
        );

        return res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('GET FRAUD CASES ERROR:', err);
        return res.status(500).json({ success: false });
    }
};

/* ================= SUPERVISOR: UPDATE FRAUD STATUS ================= */
export const updateFraudStatus = async (req: AuthRequest, res: Response) => {
    try {
        const fraudId = req.params.id;
        const { status } = req.body; // 'resolved' or 'escalated'
        const supervisorId = req.user?.userId;

        if (!['resolved', 'escalated'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateRes = await pool.query(
            `UPDATE fraud_cases 
       SET status = $1, resolved_at = NOW(), resolved_by = $2 
       WHERE id = $3 
       RETURNING *`,
            [status, supervisorId, fraudId]
        );

        if (supervisorId) {
            await logAuditAction(supervisorId, 'RESOLVE_FRAUD_CASE', { fraudId, status });
        }

        if (!updateRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Fraud case not found' });
        }

        return res.json({ success: true, data: updateRes.rows[0] });
    } catch (err) {
        console.error('UPDATE FRAUD STATUS ERROR:', err);
        return res.status(500).json({ success: false });
    }
};
