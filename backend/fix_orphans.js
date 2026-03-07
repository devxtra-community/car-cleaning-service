const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function fix() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query("UPDATE salaries SET salary_cycle_id = '1ce00883-d702-4fb0-a28e-ba40bd00e751' WHERE salary_cycle_id IS NULL AND user_id NOT IN (SELECT user_id FROM salaries WHERE salary_cycle_id = '1ce00883-d702-4fb0-a28e-ba40bd00e751' AND user_id IS NOT NULL)");
    console.log('Fixed Salaries:', res.rowCount);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}

fix();
