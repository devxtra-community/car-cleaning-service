"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.hashToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const getJwtConfig = () => ({
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET_KEY,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET_KEY,
    ACCESS_EXPIRES_WEB: process.env.JWT_ACCESS_EXPIRES_WEB,
    ACCESS_EXPIRES_MOBILE: process.env.JWT_ACCESS_EXPIRES_MOBILE,
    REFRESH_EXPIRES_WEB: process.env.JWT_REFRESH_EXPIRES_WEB,
    REFRESH_EXPIRES_MOBILE: process.env.JWT_REFRESH_EXPIRES_MOBILE,
});
const ISSUER = 'your-app-name';
/* ------------------ Generators ------------------ */
const generateAccessToken = (payload, clientType) => {
    const config = getJwtConfig();
    return jsonwebtoken_1.default.sign(payload, config.ACCESS_SECRET, {
        expiresIn: clientType === 'web' ? config.ACCESS_EXPIRES_WEB : config.ACCESS_EXPIRES_MOBILE,
        algorithm: 'HS256',
        issuer: ISSUER,
        audience: clientType,
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload, clientType) => {
    const config = getJwtConfig();
    return jsonwebtoken_1.default.sign(payload, config.REFRESH_SECRET, {
        expiresIn: clientType === 'web' ? config.REFRESH_EXPIRES_WEB : config.REFRESH_EXPIRES_MOBILE,
        algorithm: 'HS256',
        issuer: ISSUER,
        audience: clientType,
    });
};
exports.generateRefreshToken = generateRefreshToken;
/* ------------------ Utilities ------------------ */
const hashToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
exports.hashToken = hashToken;
const verifyRefreshToken = (token) => {
    const config = getJwtConfig();
    try {
        return jsonwebtoken_1.default.verify(token, config.REFRESH_SECRET, {
            issuer: ISSUER,
        });
    }
    catch {
        throw new Error('Invalid or expired refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
