"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectDatabase_1 = require("../database/connectDatabase");
const inspectUsers = async () => {
    try {
        const res = await connectDatabase_1.pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
        console.log('Users Table Columns:', res.rows.map((r) => r.column_name));
    }
    catch (error) {
        console.error('Inspect Error:', error);
    }
    finally {
        await connectDatabase_1.pool.end();
    }
};
inspectUsers();
