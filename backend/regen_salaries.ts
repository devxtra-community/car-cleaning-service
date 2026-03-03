import { generateSalaryForAllUsers } from './src/modules/salary/salary_service';
import { connectDatabase } from './src/database/connectDatabase';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await connectDatabase();
    try {
        const cycleId = '1ce00883-d702-4fb0-a28e-ba40bd00e751';
        console.log('Generating for cycle:', cycleId);
        const res = await generateSalaryForAllUsers(cycleId);
        console.log('Result:', res);
    } catch (err: any) {
        console.error('TOP LEVEL ERROR:', err.message, err.detail, err.hint, err.where);
    } finally {
        process.exit(0);
    }
}

run();
