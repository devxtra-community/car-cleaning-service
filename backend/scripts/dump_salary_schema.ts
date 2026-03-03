import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

const dumpSchema = async () => {
    let client;
    try {
        client = await pool.connect();

        console.log('--- USERS TABLE ---');
        const usersCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
        console.table(usersCols.rows);

        console.log('--- SALARIES TABLE ---');
        const salaryCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'salaries'
      ORDER BY ordinal_position;
    `);
        console.table(salaryCols.rows);

        console.log('--- CLEANERS TABLE ---');
        const cleanerCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cleaners'
      ORDER BY ordinal_position;
    `);
        console.table(cleanerCols.rows);

    } catch (err) {
        console.error('Error dumping schema:', err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
};

dumpSchema();
