import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import winston from 'winston';

const logtail = new Logtail(process.env.BETTERSTACK_SOURCE_TOKEN!, {
  endpoint: `https://${process.env.BETTERSTACK_HOST}`,
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'car-cleaning-backend',
    environment: process.env.NODE_ENV ?? 'development',
  },
  transports: [
    // Keep logs visible in your terminal
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    // Send logs to Better Stack
    new LogtailTransport(logtail),
  ],
});
