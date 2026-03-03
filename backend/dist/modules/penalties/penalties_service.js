"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPenalty = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const createPenalty = async (data) => {
    const result = await connectDatabase_1.pool.query(`
    INSERT INTO penalties (
      cleaner_id,
      amount,
      reason,
      applied_by,
      created_at
    )
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
    `, [data.cleaner_id, data.amount, data.reason, data.applied_by]);
    return result.rows[0];
};
exports.createPenalty = createPenalty;
