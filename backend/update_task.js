const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("UPDATE tasks SET created_at = NOW() WHERE cleaner_id='62109cb6-4932-4b81-97d5-2004d554ad56' AND status != 'completed'")
  .then(() => console.log('Updated open tasks to NOW()'))
  .catch(console.error)
  .finally(() => process.exit());
