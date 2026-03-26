import { pool } from './src/database/connectDatabase';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
     const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('cleaners', 'cleaner_assigned_vehicles', 'incentive_rules', 'users')
        AND column_name = 'is_active'
     `);
     console.log('Tables with is_active:', res.rows.map(r => r.table_name));

     const res2 = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('cleaners', 'cleaner_assigned_vehicles', 'incentive_rules', 'users')
        AND column_name LIKE '%active%'
     `);
     console.log('Tables with %active%:', res2.rows);

     const res3 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cleaner_assigned_vehicles'
     `);
     console.log('cleaner_assigned_vehicles columns:', res3.rows.map(r => r.column_name));

  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}

run();
