import { pool } from '../../database/connectDatabase';
import { CreatePenaltyDTO } from './penalties_types';

export const createPenalty = async (data: CreatePenaltyDTO) => {
  const result = await pool.query(
    `
    INSERT INTO penalties (
      cleaner_id,
      amount,
      reason,
      applied_by,
      created_at
    )
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
    `,
    [data.cleaner_id, data.amount, data.reason, data.applied_by]
  );

  return result.rows[0];
};
