import { pool } from '../../database/connectDatabase';

export const updateUserPushToken = async (userId: string, token: string) => {
  await pool.query('UPDATE users SET push_token = $1 WHERE id = $2', [token, userId]);
};
