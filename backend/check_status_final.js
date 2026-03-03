const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query("SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'salary_status'");
    console.log("Salary Status Enum Labels:", res.rows.map(r => r.enumlabel));
    
    const colRes = await client.query("SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = 'salaries' AND column_name = 'status'");
    console.log("Salaries Status Column Type:", colRes.rows[0]);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}

check();
