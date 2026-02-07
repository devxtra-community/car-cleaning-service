type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogMeta = Record<string, unknown>;
const isProduction = process.env.NODE_ENV === 'production';

function log(level: LogLevel, message: string, meta?: LogMeta) {
  if (level === 'debug' && isProduction) return;

  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta && { meta }),
  };

  switch (level) {
    case 'error':
      console.error(logEntry);
      break;
    case 'warn':
      console.warn(logEntry);
      break;
    default:
      console.log(logEntry);
  }
}

export const logger = {
  info: (message: string, meta?: LogMeta) => log('info', message, meta),

  warn: (message: string, meta?: LogMeta) => log('warn', message, meta),

  error: (message: string, meta?: LogMeta) => log('error', message, meta),

  debug: (message: string, meta?: LogMeta) => log('debug', message, meta),
};
