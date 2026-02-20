"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPenalties = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
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
        // Using current date as reference
        if (period === 'day') {
            dateCondition = `AND created_at::date = CURRENT_DATE`;
        }
        else if (period === 'week') {
            // Current week
            dateCondition = `
        AND created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      `;
        }
        else if (period === 'month') {
            // Current month
            dateCondition = `
        AND created_at >= date_trunc('month', CURRENT_DATE)
        AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
      `;
        }
        else {
            // Default to all time or specific limit if needed, but let's default to week if invalid
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
