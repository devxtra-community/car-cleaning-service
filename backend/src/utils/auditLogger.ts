import { pool } from '../database/connectDatabase';

export const logAuditAction = async (userId: string, action: string, details: any) => {
    try {
        const query = `
            INSERT INTO audit_logs (user_id, action, details)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [userId, action, JSON.stringify(details)];
        await pool.query(query, values);
        console.log(`[AUDIT] Action: ${action} by User: ${userId}`);
    } catch (err) {
        console.error('FAILED TO LOG AUDIT ACTION:', err);
    }
};
