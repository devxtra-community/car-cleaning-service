const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT t.id, t.created_at, t.started_at, t.car_type, v.wash_time FROM tasks t LEFT JOIN vehicles v ON t.car_type = v.type ORDER BY t.created_at DESC LIMIT 3')
  .then(res => fs.writeFileSync('db_out.json', JSON.stringify(res.rows, null, 2)))
  .catch(console.error)
  .finally(() => process.exit());
