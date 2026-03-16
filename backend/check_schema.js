const { Client } = require('pg');
const fs = require('fs');

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    const salariesRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'salaries'
    `);
    
    const usersRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const cleanersRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cleaners'
    `);

    const result = {
      salaries: salariesRes.rows,
      users: usersRes.rows,
      cleaners: cleanersRes.rows
    };

    fs.writeFileSync('schema_dump.json', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
