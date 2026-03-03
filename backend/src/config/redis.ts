import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redis.on('connect', () => {
    console.log(`[REDIS] Connected to ${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on('error', (err: any) => {
    console.error('[REDIS] Error:', err);
});

export const getCache = async (key: string) => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error(`[REDIS] Get error for key ${key}:`, err);
        return null;
    }
};

export const setCache = async (key: string, value: any, ttlSeconds: number = 300) => {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
        console.error(`[REDIS] Set error for key ${key}:`, err);
    }
};

export const delCache = async (key: string) => {
    try {
        await redis.del(key);
    } catch (err) {
        console.error(`[REDIS] Del error for key ${key}:`, err);
    }
};

export default redis;
