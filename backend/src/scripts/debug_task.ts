import { pool } from '../database/connectDatabase';

const debugTask = async () => {
  try {
    const res = await pool.query(`
      SELECT 
        t.id, 
        t.created_at, 
        t.car_type, 
        v.wash_time, 
        NOW() as server_now 
      FROM tasks t
      LEFT JOIN vehicles v ON t.car_type = v.type
      ORDER BY t.created_at DESC 
      LIMIT 1
    `);
    console.log('Latest Task Debug:', res.rows[0]);
  } catch (error) {
    console.error('Debug Error:', error);
  } finally {
    await pool.end();
  }
};

debugTask();
