import { pool } from '../database/connectDatabase';

const inspectUsers = async () => {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log(
      'Users Table Columns:',
      res.rows.map((r) => r.column_name)
    );
  } catch (error) {
    console.error('Inspect Error:', error);
  } finally {
    await pool.end();
  }
};

inspectUsers();
