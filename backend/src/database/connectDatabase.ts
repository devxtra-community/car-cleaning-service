import { Pool } from 'pg';
import { logger } from '../config/logger';

const MAX_STARTUP_RETRIES = 5;
const STARTUP_RETRY_DELAY_MS = 3000;
const RECONNECT_INTERVAL_MS = 10000;

let isDbConnected = false;
let reconnectInterval: NodeJS.Timeout | null = null;



export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryConnectOnce(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    if (!isDbConnected) {
      logger.info('Neon PostgreSQL connected successfully');
    }

    isDbConnected = true;
    return true;
  } catch (error) {
    logger.error('Database connection attempt failed', { error });
    isDbConnected = false;
    return false;
  }
}

async function startupConnect() {
  for (let attempt = 1; attempt <= MAX_STARTUP_RETRIES; attempt++) {
    logger.info('Attempting database connection', {
      attempt,
      maxRetries: MAX_STARTUP_RETRIES,
    });

    const success = await tryConnectOnce();
    if (success) return;

    if (attempt < MAX_STARTUP_RETRIES) {
      logger.warn(`Retrying database connection in ${STARTUP_RETRY_DELAY_MS / 1000}s`);
      await delay(STARTUP_RETRY_DELAY_MS);
    }
  }

  logger.error('Max DB connection retries reached');
  logger.error('Running in degraded mode (no DB)');

  startBackgroundReconnect();
}

function startBackgroundReconnect() {
  if (reconnectInterval) return;

  logger.warn(`Starting background DB reconnection every ${RECONNECT_INTERVAL_MS / 1000}s`);

  reconnectInterval = setInterval(async () => {
    if (isDbConnected) return;

    logger.info('Attempting DB reconnection in background');

    const success = await tryConnectOnce();
    if (success) {
      logger.info('Database connection restored');
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

export async function connectDatabase() {
  await startupConnect();
}
export function isDatabaseConnected() {
  return isDbConnected;
}
