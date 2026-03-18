require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Client } = require('pg');

async function diagnostic() {
    console.log('--- STARTING DIAGNOSTIC ---');

    // 1. Test Database
    console.log('\nTesting Database Connection...');
    const dbClient = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await dbClient.connect();
        console.log('✅ DB Connected');
        const res = await dbClient.query('SELECT 1');
        console.log('✅ DB Query Successful');
    } catch (err) {
        console.error('❌ DB Connection Failed:', err.message);
    } finally {
        await dbClient.end();
    }

    // 2. Test S3
    console.log('\nTesting S3 Connection...');
    const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            MaxKeys: 1
        });
        await s3.send(command);
        console.log('✅ S3 Bucket Access Successful');
    } catch (err) {
        console.error('❌ S3 Access Failed:', err.message);
        if (err.message.includes('ENOTFOUND') || err.message.includes('EAI_AGAIN')) {
            console.log('💡 TIP: Check internet connection or AWS_REGION');
        }
    }

    console.log('\n--- DIAGNOSTIC COMPLETE ---');
}

diagnostic();
