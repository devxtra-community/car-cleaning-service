"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: token missing',
            });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET_KEY);
        req.user = decoded;
        console.log('USER FROM TOKEN:', req.user);
        next();
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: invalid token',
            err,
        });
    }
};
exports.authMiddleware = authMiddleware;
// Keep the old export for backward compatibility
exports.protect = exports.authMiddleware;
