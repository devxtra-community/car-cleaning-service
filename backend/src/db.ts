import { Pool } from 'pg';

// Initialize a single Postgres pool using the environment variable
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
