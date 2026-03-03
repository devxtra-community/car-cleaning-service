import { pool } from '../../database/connectDatabase';
import { CreatePenaltyDTO } from './penalties_types';
import { sendNotificationToUser } from '../notifications/notification_service';

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

  const penalty = result.rows[0];

  // Send notification to the cleaner
  try {
    const userRes = await pool.query('SELECT user_id FROM cleaners WHERE id = $1', [data.cleaner_id]);
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].user_id;
      await sendNotificationToUser(
        userId,
        'Penalty Applied',
        `A penalty of ${data.amount} has been applied to your account for: ${data.reason}`
      );
    }
  } catch (err) {
    console.error('Error sending penalty notification:', err);
  }

  return penalty;
};
