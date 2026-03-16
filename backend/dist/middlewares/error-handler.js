"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.globalErrorHandler = globalErrorHandler;
const logger_1 = require("../config/logger");
class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
exports.AppError = AppError;
function globalErrorHandler(err, req, res, _next) {
    let statusCode = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
    }
    else if (err instanceof Error) {
        message = err.message;
    }
    logger_1.logger.error('Unhandled error', {
        path: req.path,
        method: req.method,
        statusCode,
        code,
        errorMessage: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
    });
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
        },
        timestamp: new Date().toISOString(),
    });
}
