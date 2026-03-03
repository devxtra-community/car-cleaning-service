"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const connectDatabase_1 = require("../database/connectDatabase");
const debugTask = async () => {
    try {
        const res = await connectDatabase_1.pool.query(`
    SELECT
    t.id,
      t.created_at,
      t.car_type,
      t.status,
      v.wash_time,
      NOW() as server_now 
      FROM tasks t
      LEFT JOIN vehicles v ON t.car_type = v.type
      ORDER BY t.created_at DESC 
      LIMIT 1
      `);
        const data = res.rows[0];
        const fs = require('fs');
        const outData = {
            id: data.id,
            created_at: data.created_at,
            server_now: data.server_now,
            js_now: new Date().toISOString(),
            wash_time: data.wash_time,
            status: data.status,
        };
        fs.writeFileSync('debug_output.json', JSON.stringify(outData, null, 2));
        console.log('Written to debug_output.json');
        // const vehiclesRes = await pool.query('SELECT type, wash_time FROM vehicles');
        // console.log('Available Vehicles:', vehiclesRes.rows);
    }
    catch (error) {
        console.error('Debug Error:', error);
    }
    finally {
        await connectDatabase_1.pool.end();
    }
};
debugTask();
