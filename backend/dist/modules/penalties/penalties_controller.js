"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupervisorPenalties = exports.addPenalty = exports.getMyPenalties = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
/* ================= WORKER: GET MY PENALTIES ================= */
const getMyPenalties = async (req, res) => {
    try {
        const workerId = req.user?.userId;
        const { period = 'week' } = req.query; // 'day' | 'week' | 'month'
        if (!workerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        // Get cleaner_id from user_id (workerId)
        const cleanerRes = await connectDatabase_1.pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
        if (!cleanerRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
        }
        const cleanerId = cleanerRes.rows[0].id;
        let dateCondition = '';
        if (period === 'day') {
            dateCondition = `AND created_at::date = CURRENT_DATE`;
        }
        else if (period === 'week') {
            dateCondition = `
        AND created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      `;
        }
        else if (period === 'month') {
            dateCondition = `
        AND created_at >= date_trunc('month', CURRENT_DATE)
        AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
      `;
        }
        else {
            dateCondition = `
        AND created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      `;
        }
        const query = `
      SELECT 
        id,
        amount,
        reason,
        created_at
      FROM penalties
      WHERE cleaner_id = $1
      ${dateCondition}
      ORDER BY created_at DESC
    `;
        const result = await connectDatabase_1.pool.query(query, [cleanerId]);
        const totalAmount = result.rows.reduce((sum, p) => sum + Number(p.amount), 0);
        return res.json({
            success: true,
            data: result.rows,
            meta: {
                totalAmount,
                count: result.rows.length,
                period,
            },
        });
    }
    catch (err) {
        console.error('GET PENALTIES ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};
exports.getMyPenalties = getMyPenalties;
/* ================= SUPERVISOR: ADD PENALTY ================= */
const addPenalty = async (req, res) => {
    try {
        const supervisorId = req.user?.userId;
        if (!supervisorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { worker_id, amount, reason } = req.body;
        if (!worker_id || !amount || !reason) {
            return res
                .status(400)
                .json({ success: false, message: 'worker_id, amount and reason are required' });
        }
        // Verify the worker belongs to this supervisor
        const workerCheck = await connectDatabase_1.pool.query(`SELECT c.id AS cleaner_id
       FROM cleaners c
       JOIN supervisors s ON c.supervisor_id = s.id
       WHERE c.user_id = $1 AND s.user_id = $2`, [worker_id, supervisorId]);
        if (!workerCheck.rows.length) {
            return res
                .status(403)
                .json({ success: false, message: 'Worker not assigned to you or invalid worker ID' });
        }
        const cleanerId = workerCheck.rows[0].cleaner_id;
        const result = await connectDatabase_1.pool.query(`INSERT INTO penalties (cleaner_id, amount, reason, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`, [cleanerId, parseFloat(amount), reason]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        console.error('ADD PENALTY ERROR:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
exports.addPenalty = addPenalty;
/* ================= SUPERVISOR: GET PENALTIES FOR THEIR WORKERS ================= */
const getSupervisorPenalties = async (req, res) => {
    try {
        const supervisorId = req.user?.userId;
        const { period = 'week' } = req.query;
        if (!supervisorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        let dateCondition = '';
        if (period === 'day') {
            dateCondition = `AND p.created_at::date = CURRENT_DATE`;
        }
        else if (period === 'month') {
            dateCondition = `
        AND p.created_at >= date_trunc('month', CURRENT_DATE)
        AND p.created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
      `;
        }
        else {
            // default: week
            dateCondition = `
        AND p.created_at >= date_trunc('week', CURRENT_DATE)
        AND p.created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      `;
        }
        const result = await connectDatabase_1.pool.query(`SELECT
         p.id,
         p.amount,
         p.reason,
         p.created_at,
         u.full_name AS worker_name
       FROM penalties p
       JOIN cleaners c ON c.id = p.cleaner_id
       JOIN users u ON u.id = c.user_id
       JOIN supervisors s ON c.supervisor_id = s.id
       WHERE s.user_id = $1
       ${dateCondition}
       ORDER BY p.created_at DESC`, [supervisorId]);
        const totalAmount = result.rows.reduce((sum, p) => sum + Number(p.amount), 0);
        return res.json({
            success: true,
            data: result.rows,
            meta: { totalAmount, count: result.rows.length, period },
        });
    }
    catch (err) {
        console.error('GET SUPERVISOR PENALTIES ERROR:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
exports.getSupervisorPenalties = getSupervisorPenalties;
