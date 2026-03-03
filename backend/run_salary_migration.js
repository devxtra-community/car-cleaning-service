const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("Connected to database. Starting migration...");

    // Rename columns
    await client.query(`ALTER TABLE salaries RENAME COLUMN cleaner_id TO user_id;`);
    console.log("Renamed cleaner_id to user_id");

    await client.query(`ALTER TABLE salaries RENAME COLUMN net_salary TO final_salary;`);
    console.log("Renamed net_salary to final_salary");

    await client.query(`ALTER TABLE salaries RENAME COLUMN paid_at TO payout_date;`);
    console.log("Renamed paid_at to payout_date");

    await client.query(`ALTER TABLE salaries RENAME COLUMN total_incentives TO incentives;`);
    console.log("Renamed total_incentives to incentives");

    await client.query(`ALTER TABLE salaries RENAME COLUMN total_penalties TO penalties;`);
    console.log("Renamed total_penalties to penalties");

    // Drop unused fields
    await client.query(`ALTER TABLE salaries DROP COLUMN IF EXISTS gross_salary;`);
    await client.query(`ALTER TABLE salaries DROP COLUMN IF EXISTS total_tasks;`);
    await client.query(`ALTER TABLE salaries DROP COLUMN IF EXISTS bank_account;`);
    await client.query(`ALTER TABLE salaries DROP COLUMN IF EXISTS monthly_review;`);
    await client.query(`ALTER TABLE salaries DROP COLUMN IF EXISTS payment_method;`);
    console.log("Dropped gross_salary, total_tasks, bank_account, monthly_review, payment_method");

    console.log("Migration complete!");
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
