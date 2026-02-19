import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          })
        )
  ),

  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export { logger };
