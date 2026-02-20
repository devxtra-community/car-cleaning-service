"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.connectDatabase = connectDatabase;
exports.isDatabaseConnected = isDatabaseConnected;
const pg_1 = require("pg");
const logger_1 = require("../config/logger");
const MAX_STARTUP_RETRIES = 5;
const STARTUP_RETRY_DELAY_MS = 3000;
const RECONNECT_INTERVAL_MS = 10000;
let isDbConnected = false;
let reconnectInterval = null;
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 5000,
});
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function tryConnectOnce() {
    try {
        const client = await exports.pool.connect();
        await client.query('SELECT 1');
        client.release();
        if (!isDbConnected) {
            logger_1.logger.info('Neon PostgreSQL connected successfully');
        }
        isDbConnected = true;
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection attempt failed', { error });
        isDbConnected = false;
        return false;
    }
}
async function startupConnect() {
    for (let attempt = 1; attempt <= MAX_STARTUP_RETRIES; attempt++) {
        logger_1.logger.info('Attempting database connection', {
            attempt,
            maxRetries: MAX_STARTUP_RETRIES,
        });
        const success = await tryConnectOnce();
        if (success)
            return;
        if (attempt < MAX_STARTUP_RETRIES) {
            logger_1.logger.warn(`Retrying database connection in ${STARTUP_RETRY_DELAY_MS / 1000}s`);
            await delay(STARTUP_RETRY_DELAY_MS);
        }
    }
    logger_1.logger.error('Max DB connection retries reached');
    logger_1.logger.error('Running in degraded mode (no DB)');
    startBackgroundReconnect();
}
function startBackgroundReconnect() {
    if (reconnectInterval)
        return;
    logger_1.logger.warn(`Starting background DB reconnection every ${RECONNECT_INTERVAL_MS / 1000}s`);
    reconnectInterval = setInterval(async () => {
        if (isDbConnected)
            return;
        logger_1.logger.info('Attempting DB reconnection in background');
        const success = await tryConnectOnce();
        if (success) {
            logger_1.logger.info('Database connection restored');
            stopBackgroundReconnect();
        }
    }, RECONNECT_INTERVAL_MS);
}
function stopBackgroundReconnect() {
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
    }
}
async function connectDatabase() {
    await startupConnect();
}
function isDatabaseConnected() {
    return isDbConnected;
}
