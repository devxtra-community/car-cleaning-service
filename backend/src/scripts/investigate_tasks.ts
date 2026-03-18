require('dotenv').config();
import { pool } from '../database/connectDatabase';
import * as fs from 'fs';

const investigate = async () => {
  try {
    const ids = ['a00ff872-dff9-4936-92d9-7fac7b3ab9c1', 'ffb17c7f-1e73-48b1-aefe-27a1de583ccb'];

    const res = await pool.query(
      `
      SELECT id, created_at, status, car_number, task_amount
      FROM tasks
      WHERE id = ANY($1)
    `,
      [ids]
    );

    console.log('Found tasks:', res.rows);
    fs.writeFileSync('investigation_output.json', JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
};

investigate();
