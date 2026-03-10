const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function checkTasksSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `);

    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkTasksSchema();
