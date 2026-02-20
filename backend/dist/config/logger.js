"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const isProduction = process.env.NODE_ENV === 'production';
function log(level, message, meta) {
    if (level === 'debug' && isProduction)
        return;
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
exports.logger = {
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
    debug: (message, meta) => log('debug', message, meta),
};
