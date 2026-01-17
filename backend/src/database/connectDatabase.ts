import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const connectDatabase = async () => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("PostgreSQL connected & test query passed");
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    process.exit(1);
  }
};
