"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.getPool = void 0;
exports.connectDatabase = connectDatabase;
exports.isDatabaseConnected = isDatabaseConnected;
const pg_1 = require("pg");
const logger_1 = require("../config/logger");
// Force timestamps to be parsed as UTC to avoid double-offset issues in IST environments
const TIMESTAMP_OID = 1114;
pg_1.types.setTypeParser(TIMESTAMP_OID, (stringValue) => {
    return new Date(stringValue + 'Z');
});
const MAX_STARTUP_RETRIES = 5;
const STARTUP_RETRY_DELAY_MS = 3000;
const RECONNECT_INTERVAL_MS = 10000;
let isDbConnected = false;
let reconnectInterval = null;
let poolInstance = null;
const getPool = () => {
    if (!poolInstance) {
        poolInstance = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false,
            },
            connectionTimeoutMillis: 5000,
        });
    }
    return poolInstance;
};
exports.getPool = getPool;
// Backward-compatible `pool` export via lazy proxy
exports.pool = {
    query: (text, params) => (0, exports.getPool)().query(text, params),
    connect: () => (0, exports.getPool)().connect(),
    end: () => poolInstance?.end(),
};
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
