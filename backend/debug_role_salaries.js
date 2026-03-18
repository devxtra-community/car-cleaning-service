const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const cycleId = null; // Test "All Cycles"
    const params = [];
    let cycleFilter = '';
    if (cycleId) {
      cycleFilter = 'AND s.salary_cycle_id = $1';
      params.push(cycleId);
    }

    const query = `SELECT
      u.id              AS user_id,
      u.full_name,
      u.role,
      u.email,
      COALESCE(b_c.building_name, b_s.building_name, 'N/A') AS building_name,
      COALESCE(u.base_salary, 0) AS base_salary,
      CASE 
        WHEN u.role = 'cleaner' THEN COALESCE(s.incentives, 0)
        ELSE 0 
      END AS incentives,
      CASE 
        WHEN u.role = 'cleaner' THEN COALESCE(s.penalties, 0)
        ELSE 0 
      END AS penalties,
      COALESCE(s.final_salary, COALESCE(u.base_salary, 0)) AS final_salary,
      COALESCE(s.status, 'not_generated') AS status,
      s.payout_date,
      s.id AS salary_id,
      CONCAT(sc.year, '-', LPAD(sc.month::text, 2, '0')) AS salary_month
    FROM users u
    LEFT JOIN cleaners cl ON cl.user_id = u.id
    LEFT JOIN buildings b_c ON b_c.id = cl.building_id
    LEFT JOIN supervisors sv ON sv.user_id = u.id
    LEFT JOIN buildings b_s ON b_s.id = sv.building_id
    LEFT JOIN salaries s ON s.user_id = u.id ${cycleFilter}
    LEFT JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
    WHERE u.role IN ('cleaner', 'supervisor')
    ORDER BY u.role, u.full_name`;
    
    console.log('Query:', query);
    const res = await client.query(query, params);
    console.log('Results Count:', res.rowCount);
    console.log('Sample:', res.rows[0]);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}

test();
