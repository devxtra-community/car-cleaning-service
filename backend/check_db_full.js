const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query("SELECT column_name, udt_name, data_type FROM information_schema.columns WHERE table_name = 'salaries'");
    console.log(JSON.stringify(res.rows, null, 2));
    
    const enums = await client.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      ORDER BY t.typname, e.enumsortorder
    `);
    console.log("Database Enums:");
    console.log(JSON.stringify(enums.rows, null, 2));
    
    const sample = await client.query("SELECT * FROM salaries LIMIT 1");
    console.log("Sample Salary Record:");
    console.log(JSON.stringify(sample.rows, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}

check();
