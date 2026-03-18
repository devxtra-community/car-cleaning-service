require('dotenv').config();
const { Client } = require('pg');

async function checkSupervisorsSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();

        const res = await client.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      ORDER BY t.typname, e.enumsortorder
    `);

        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkSupervisorsSchema();
