import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function createFraudTable() {
    try {
        const query = `
      CREATE TABLE IF NOT EXISTS fraud_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'missing_photo', 'too_fast', 'duplicate_vehicle'
        status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'resolved', 'escalated'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
      );
    `;
        await pool.query(query);
        console.log("fraud_cases table created successfully.");
    } catch (err) {
        console.error("Error creating fraud_cases table:", err);
    } finally {
        await pool.end();
    }
}

createFraudTable();
