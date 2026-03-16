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

const updateSchema = async () => {
  let client;
  try {
    console.log('Running schema update for job completion workflow...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? 'FOUND' : 'NOT FOUND');

    client = await pool.connect();

    // Update tasks table
    await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS task_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS after_wash_image_url TEXT,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS final_price DECIMAL(10, 2);
    `);

    console.log('✓ Tasks table updated successfully');

    // Create reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id),
        cleaner_id UUID NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✓ Reviews table created successfully');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_task_id ON reviews(task_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_cleaner_id ON reviews(cleaner_id);
    `);

    console.log('✓ Indexes created successfully');
    console.log('\n✅ Schema update completed successfully!');
  } catch (err) {
    console.error('❌ Schema update failed:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

updateSchema();
