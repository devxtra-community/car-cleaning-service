const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const BASE_URL = 'http://localhost:3033';
const USER_ID = 'fc826552-b178-4a48-9cdd-3ba1d016ea8d';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET_KEY;

const runTest = async () => {
  let client;
  try {
    console.log('Starting Verification...');

    // 1. Generate Token
    const token = jwt.sign({ userId: USER_ID, role: 'cleaner', tokenVersion: 0 }, JWT_SECRET, {
      expiresIn: '1h',
      audience: 'mobile',
      issuer: 'your-app-name',
    });
    console.log('Token generated.');

    // 2. Find Pending Task
    client = await pool.connect();
    // Get cleaner ID
    const cleanerRes = await client.query('SELECT id FROM cleaners WHERE user_id = $1', [USER_ID]);
    const cleanerId = cleanerRes.rows[0].id;

    const taskRes = await client.query(
      `
        SELECT id FROM tasks 
        WHERE cleaner_id = $1 AND status = 'pending' 
        ORDER BY created_at DESC LIMIT 1
    `,
      [cleanerId]
    );

    if (taskRes.rowCount === 0) {
      console.log('No pending task found. Cannot test completion.');
      return;
    }

    const taskId = taskRes.rows[0].id;
    console.log(`Found Pending Task: ${taskId}`);

    // 3. Call Completion API
    const payload = {
      after_wash_image_url: 'https://test-bucket.s3.amazonaws.com/test-image.jpg',
      payment_method: 'cash',
      final_price: 500,
    };

    console.log('Sending Payload:', payload);

    try {
      const res = await fetch(`${BASE_URL}/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('API Response:', res.status, data);
    } catch (apiErr) {
      console.error('API Error:', apiErr.message);
      return;
    }

    // 4. Verify DB Update
    const verifyRes = await client.query(
      `
        SELECT id, status, final_price, after_wash_image_url 
        FROM tasks WHERE id = $1
    `,
      [taskId]
    );

    console.log('DB Verification:', verifyRes.rows[0]);

    if (verifyRes.rows[0].final_price === '500.00' || verifyRes.rows[0].final_price === 500) {
      console.log('✅ SUCCESS: Final Price updated correctly!');
    } else {
      console.log('❌ FAILURE: Final Price mismatch or null.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (client) client.release();
    pool.end();
  }
};

runTest();
