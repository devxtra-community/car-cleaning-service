const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query("SELECT count(*) FROM salaries WHERE salary_cycle_id = '1ce00883-d702-4fb0-a28e-ba40bd00e751'");
    console.log('Jan_2026_Count:', res.rows[0].count);
    
    const orphans = await client.query("SELECT count(*) FROM salaries WHERE salary_cycle_id IS NULL");
    console.log('Orphan_Count:', orphans.rows[0].count);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}

check();
