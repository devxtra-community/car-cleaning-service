import { pool } from './src/database/connectDatabase';
async function run() {
    try {
        const res = await pool.query(`SELECT t.*, v.wash_time FROM tasks t LEFT JOIN vehicles v ON t.car_type = v.type WHERE t.cleaner_id='62109cb6-4932-4b81-97d5-2004d554ad56' AND t.status!='completed' ORDER BY t.created_at DESC LIMIT 1`);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) { console.error(e); }
    process.exit();
}
run();
